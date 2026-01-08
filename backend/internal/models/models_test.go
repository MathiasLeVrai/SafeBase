package models

import "testing"

func TestDatabaseModel(t *testing.T) {
	db := Database{
		Name: "Test DB",
		Type: "mysql",
		Port: 3306,
	}

	if db.Name != "Test DB" {
		t.Errorf("Expected Name to be 'Test DB', got '%s'", db.Name)
	}
}

