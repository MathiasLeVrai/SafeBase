# 🏗️ Architecture du Backend SafeBase

## 📁 Structure du projet

```
backend/
├── cmd/server/main.go          # Point d'entrée de l'application
├── internal/                    # Code interne (non exportable)
│   ├── api/                     # API REST (Gin Framework)
│   │   ├── handlers.go         # Fonctions qui gèrent les requêtes HTTP
│   │   └── routes.go           # Définition des routes API
│   ├── backup/                  # Moteur de sauvegarde
│   │   └── backup.go           # Exécution des sauvegardes (mysqldump/pg_dump)
│   ├── database/                # Accès à la base SQLite (GORM)
│   │   └── database.go         # Connexion et opérations sur SQLite
│   ├── models/                  # Modèles de données
│   │   └── models.go           # Structures Go (Database, Backup, BackupSchedule)
│   └── scheduler/                # Planificateur de tâches (Cron)
│       └── scheduler.go         # Gestion des tâches planifiées
├── backups/                     # Dossier contenant les fichiers de sauvegarde
├── safebase.db                  # Base SQLite (stocke configs + métadonnées)
├── go.mod                       # Dépendances Go
└── scripts/                     # Scripts utilitaires
```

---

## 🔄 Flux de l'application

### 1. Démarrage (`cmd/server/main.go`)

```
main() 
  ├─ InitDB()           → Crée/connecte SQLite
  ├─ NewScheduler()     → Crée le planificateur
  ├─ sched.Start()      → Lance le cron
  ├─ NewHandler()       → Crée les handlers API
  ├─ SetupRoutes()      → Configure les routes
  └─ router.Run()       → Démarre le serveur HTTP (port 8081)
```

### 2. Requête HTTP → Réponse

```
Client (Frontend)
    ↓ HTTP Request
routes.go          → Route la requête vers le bon handler
    ↓
handlers.go        → Traite la requête, utilise les autres modules
    ├─ database.DB → Accède aux données (SQLite)
    ├─ scheduler   → Gère les planifications
    └─ backup      → Exécute les sauvegardes
    ↓
Réponse JSON
```

---

## 📦 Modules détaillés

### `cmd/server/main.go` - Point d'entrée

**Rôle :** Initialise tout et démarre le serveur

**Ce qu'il fait :**
- Lit les variables d'environnement (PORT, DB_PATH, BACKUP_DIR)
- Initialise la base SQLite
- Crée le scheduler de sauvegardes
- Configure les routes API
- Lance le serveur HTTP sur le port 8081

**Variables d'environnement :**
- `PORT` : Port du serveur (défaut: 8081)
- `DB_PATH` : Chemin SQLite (défaut: ./safebase.db)
- `BACKUP_DIR` : Dossier des backups (défaut: ./backups)

---

### `internal/models/models.go` - Modèles de données

**Rôle :** Définit les structures de données (comme des "classes")

**3 structures principales :**

1. **`Database`** : Configuration d'une base MySQL/PostgreSQL
   - ID, Nom, Type, Host, Port, Username, Password
   - Status (connected/disconnected/error)
   - Statistiques (LastBackup, BackupCount)

2. **`BackupSchedule`** : Planification de sauvegarde
   - CronExpression (ex: "0 */12 * * *")
   - Enabled (activée/désactivée)
   - NextRun, LastRun (dates)

3. **`Backup`** : Enregistrement d'une sauvegarde effectuée
   - Status (success/failed/in_progress)
   - FilePath, Size, Duration
   - Error (si échec)

**Tags GORM :** `gorm:"..."` pour la base de données
**Tags JSON :** `json:"..."` pour l'API REST

---

### `internal/database/database.go` - Accès aux données

**Rôle :** Gère la connexion SQLite et les opérations CRUD

**Fonctions principales :**
- `InitDB()` : Ouvre SQLite et crée les tables automatiquement
- `GetEnabledSchedules()` : Récupère les planifications actives
- `UpdateScheduleNextRun()` : Met à jour la prochaine exécution
- `UpdateScheduleLastRun()` : Met à jour la dernière exécution

**SQLite (`safebase.db`) contient :**
- Toutes les configurations de bases de données
- Toutes les planifications
- L'historique de toutes les sauvegardes (pas les fichiers, juste les métadonnées)

---

### `internal/backup/backup.go` - Moteur de sauvegarde

**Rôle :** Exécute les sauvegardes MySQL et PostgreSQL

**Comment ça marche :**

1. **`findCommand()`** : Cherche `mysqldump`/`pg_dump` dans les chemins système
   - Homebrew: `/opt/homebrew/opt/mysql-client/bin/`
   - Système: `/usr/local/bin/`, `/usr/bin/`

2. **`ExecuteBackup()`** : Fonction principale
   ```
   Crée un objet Backup avec status "in_progress"
       ↓
   Appelle backupMySQL() OU backupPostgreSQL()
       ↓
   Exécute mysqldump/pg_dump via os/exec
       ↓
   Sauvegarde le fichier dans backupDir/
       ↓
   Retourne Backup avec status "success" ou "failed"
   ```

3. **`backupMySQL()`** :
   - Utilise `mysqldump` avec options (single-transaction, quick)
   - Écrit dans un fichier `.sql`
   - Force TCP/IP avec `--protocol=TCP` et `127.0.0.1`

4. **`backupPostgreSQL()`** :
   - Si localhost → utilise `docker exec` (contourne conflits)
   - Sinon → utilise `pg_dump` directement
   - Format custom (`-F c`) → fichier `.dump`

**Fichiers générés :**
- MySQL : `{NomBDD}_{timestamp}.sql`
- PostgreSQL : `{NomBDD}_{timestamp}.dump`
- Stockés dans `backend/backups/`

---

### `internal/scheduler/scheduler.go` - Planificateur Cron

**Rôle :** Gère les sauvegardes automatiques selon les expressions cron

**Architecture :**

```
Scheduler
  ├─ cron.Cron          → Planificateur cron (lib robfig/cron)
  ├─ BackupExecutor     → Référence au moteur de backup
  └─ scheduleJobs       → Map des tâches actives (ID → EntryID)
```

**Fonctions clés :**

1. **`Start()`** :
   - Lance le cron
   - Charge toutes les planifications actives
   - Démarre une vérification périodique (toutes les minutes)

2. **`AddSchedule()`** :
   - Parse l'expression cron
   - Ajoute une fonction au cron qui s'exécute à l'heure prévue
   - Calcule `nextRun` et le sauvegarde

3. **`executeBackup()`** :
   - Appelle `BackupExec.ExecuteBackup()`
   - Sauvegarde le résultat dans SQLite
   - Met à jour `lastRun` et recalcule `nextRun`
   - Met à jour les stats de la base

4. **`startPeriodicCheck()`** :
   - Goroutine qui tourne en arrière-plan
   - Vérifie toutes les minutes les planifications dont `nextRun` est passé
   - Exécute les sauvegardes manquées

5. **`CalculateAndUpdateNextRun()`** :
   - Parse le cron expression
   - Calcule la prochaine date d'exécution
   - Met à jour dans SQLite

---

### `internal/api/routes.go` - Configuration des routes

**Rôle :** Définit les endpoints REST

**Structure :**
```go
/api
  ├─ /databases
  │   ├─ GET    → Liste toutes les bases
  │   ├─ GET /:id → Détails d'une base
  │   ├─ POST   → Crée une base
  │   ├─ PUT /:id → Modifie une base
  │   └─ DELETE /:id → Supprime une base
  │
  ├─ /schedules
  │   ├─ GET    → Liste les planifications
  │   ├─ GET /:id → Détails d'une planification
  │   ├─ POST   → Crée une planification
  │   ├─ PUT /:id → Modifie une planification
  │   ├─ DELETE /:id → Supprime une planification
  │   └─ POST /:id/execute → Exécute immédiatement
  │
  └─ /backups
      ├─ GET    → Liste les sauvegardes (option: ?databaseId=...)
      ├─ GET /:id → Détails d'une sauvegarde
      └─ POST /manual → Sauvegarde manuelle
```

**CORS :** Autorise toutes les origines (dev)

---

### `internal/api/handlers.go` - Logique métier

**Rôle :** Traite les requêtes HTTP et renvoie des réponses JSON

**Structure :**
```go
Handler struct {
    scheduler *scheduler.Scheduler  → Accès au planificateur
}

Méthodes :
  - GetDatabases()      → Récupère toutes les bases
  - CreateDatabase()    → Crée une nouvelle base
  - UpdateDatabase()    → Met à jour une base
  - DeleteDatabase()    → Supprime une base
  - GetSchedules()      → Liste les planifications
  - CreateSchedule()    → Crée une planification + l'ajoute au cron
  - UpdateSchedule()    → Met à jour + recharge dans le cron
  - DeleteSchedule()    → Supprime + retire du cron
  - ExecuteSchedule()   → Exécute une sauvegarde immédiatement
  - GetBackups()        → Liste les sauvegardes (filtrable)
  - CreateManualBackup() → Lance une sauvegarde manuelle
```

**Pattern typique :**
1. Parse les paramètres de la requête
2. Vérifie les permissions/existence
3. Utilise `database.DB` pour lire/écrire
4. Utilise `scheduler` pour les opérations de planification
5. Retourne JSON ou erreur HTTP

---

## 🔄 Cycle de vie d'une sauvegarde planifiée

```
1. Utilisateur crée une planification via POST /api/schedules
   ↓
2. handlers.go → CreateSchedule()
   - Sauvegarde dans SQLite
   - scheduler.AddSchedule() → Ajoute au cron
   ↓
3. Scheduler calcule nextRun et le sauvegarde
   ↓
4. Cron déclenche automatiquement à l'heure prévue
   ↓
5. executeBackup() est appelé
   ↓
6. BackupExecutor.ExecuteBackup()
   - Exécute mysqldump/pg_dump
   - Crée le fichier .sql/.dump
   ↓
7. Sauvegarde enregistrée dans SQLite (status: success/failed)
   ↓
8. Met à jour lastRun et recalcule nextRun
   ↓
9. Frontend peut récupérer via GET /api/backups
```

---

## 🗄️ Bases de données

### SQLite (`safebase.db`)
**Rôle :** Stocke toutes les configurations et métadonnées

**Tables :**
- `databases` : Configurations des bases MySQL/PostgreSQL
- `backup_schedules` : Planifications cron
- `backups` : Historique des sauvegardes (métadonnées uniquement)

**⚠️ Important :** Les fichiers de sauvegarde sont dans `backups/`, pas dans SQLite

### MySQL/PostgreSQL (Docker)
**Rôle :** Les bases de données que l'utilisateur veut sauvegarder

**Stockées dans Docker volumes** → Persistantes même après `docker-compose stop`

---

## 🔧 Technologies utilisées

- **Gin** : Framework HTTP (équivalent Express.js)
- **GORM** : ORM pour SQLite (équivalent Sequelize/TypeORM)
- **robfig/cron** : Planificateur de tâches
- **os/exec** : Exécution de commandes système (mysqldump, pg_dump)
- **UUID** : Génération d'IDs uniques

---

## 📝 Points importants

1. **Le scheduler tourne en arrière-plan** : Même sans requêtes HTTP, les sauvegardes se déclenchent automatiquement

2. **SQLite ≠ MySQL/PostgreSQL** :
   - SQLite = Configurations de SafeBase
   - MySQL/PostgreSQL = Bases à sauvegarder

3. **Les fichiers de backup** sont sur le disque dans `backups/`, SQLite contient juste les métadonnées (chemin, taille, statut)

4. **Goroutines** : Le scheduler utilise des goroutines pour vérifier périodiquement les planifications sans bloquer

5. **Docker pour PostgreSQL localhost** : Le backend détecte localhost et utilise `docker exec` pour contourner les conflits avec PostgreSQL installé localement

