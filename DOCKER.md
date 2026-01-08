# 🐳 SafeBase avec Docker

## Démarrer

```bash
docker compose up -d
```

Ouvrir : **http://localhost:3000**

---

## Ajouter vos bases de données

### Bases de données Docker (incluses)

Quand vous ajoutez une BDD dans l'interface :

**MySQL :**

- Host : `mysql`
- Port : 3306
- User : testuser
- Password : testpass
- Database : testdb

**PostgreSQL :**

- Host : `postgresql`
- Port : 5432
- User : testuser
- Password : testpass
- Database : testdb

### Base de données externe

Sur votre machine :

- Host : `host.docker.internal`

Sur le réseau :

- Host : `192.168.x.x` ou `domaine.com`

---

## Commandes utiles

```bash
# Arrêter
docker compose stop

# Redémarrer
docker compose restart

# Voir les logs
docker compose logs -f backend

# État
docker compose ps
```

---

## Problème ?

**Les BDD ne s'affichent pas ?**

Vérifiez que vous utilisez `mysql` ou `postgresql` comme host, pas `localhost`.

**Voir les BDD enregistrées :**

```bash
docker exec safebase-backend sqlite3 /app/data/safebase.db \
  "SELECT name, host FROM databases;"
```

---

**C'est tout ! 🎉**
