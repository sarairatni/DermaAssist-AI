# Troubleshooting & Common Issues

## 🔴 Backend Issues

### ❌ PostgreSQL Connection Error

**Error:**

```
sqlalchemy.exc.OperationalError: could not connect to server
```

**Solutions:**

1. Vérifier PostgreSQL en cours d'exécution:

   ```bash
   psql --version
   # ou
   sudo systemctl status postgresql
   ```

2. Créer la base de données:

   ```bash
   createdb dermassist_db
   createuser dermassist_user -P  # password: dermassist_pass
   psql -U postgres -c "ALTER USER dermassist_user CREATEDB;"
   ```

3. Vérifier la string de connexion dans `.env`:

   ```
   DATABASE_URL=postgresql://username:password@localhost:5432/dermassist_db
   ```

4. Vérifier le port (default: 5432):
   ```bash
   psql -h localhost -U postgres -d dermassist_db
   ```

---

### ❌ Redis Connection Error

**Error:**

```
redis.exceptions.ConnectionError: Error -3 Name or service not known
```

**Solutions:**

1. Installer Redis:

   ```bash
   # Linux
   sudo apt-get install redis-server

   # macOS
   brew install redis

   # Windows - Docker recommended
   docker run -d -p 6379:6379 redis:latest
   ```

2. Vérifier Redis en cours d'exécution:

   ```bash
   redis-cli ping
   # Expected output: PONG
   ```

3. Vérifier la connexion:
   ```bash
   redis-cli -h localhost -p 6379
   ```

---

### ❌ Port 8000 Already in Use

**Error:**

```
OSError: [Errno 48] Address already in use
```

**Solutions:**

1. Trouver le processus:

   ```bash
   lsof -i :8000    # macOS/Linux
   netstat -ano | findstr :8000  # Windows
   ```

2. Terminer le processus:

   ```bash
   kill -9 <PID>    # macOS/Linux
   taskkill /PID <PID> /F  # Windows
   ```

3. Ou utiliser un port différent:
   ```bash
   python main.py --port 8001
   ```

---

### ❌ Module Not Found Error

**Error:**

```
ModuleNotFoundError: No module named 'fastapi'
```

**Solutions:**

1. Vérifier l'activation du venv:

   ```bash
   source venv/bin/activate  # Linux/macOS
   venv\Scripts\activate    # Windows
   ```

2. Réinstaller les dépendances:

   ```bash
   pip install -r requirements.txt
   ```

3. Vérifier Python version (3.10+):
   ```bash
   python --version
   ```

---

### ❌ JWT Secret Key Error

**Error:**

```
ValueError: Setting not found: SECRET_KEY
```

**Solutions:**

1. Créer `.env` à partir du template:

   ```bash
   cp backend/.env.example backend/.env
   ```

2. Générer une clé secrète:

   ```bash
   python -c "import secrets; print(secrets.token_urlsafe(32))"
   ```

3. Ajouter à `.env`:
   ```
   SECRET_KEY=your-generated-secret-key-here
   ```

---

## 🟠 Frontend Issues

### ❌ Port 5173 Already in Use

**Error:**

```
Error: Port 5173 is already in use
```

**Solutions:**

```bash
# Kill process on port 5173
lsof -ti:5173 | xargs kill -9  # macOS/Linux
netstat -ano | findstr :5173 && taskkill /PID <PID> /F  # Windows

# Or use different port
npm run dev -- --port 5174
```

---

### ❌ Node Modules Not Found

**Error:**

```
npm ERR! code ENOENT
```

**Solutions:**

1. Réinstaller dépendances:

   ```bash
   rm -rf node_modules package-lock.json
   npm install
   ```

2. Nettoyer le cache npm:
   ```bash
   npm cache clean --force
   npm install
   ```

---

### ❌ CORS Error

**Error:**

```
Access to XMLHttpRequest at 'http://localhost:8000/auth/login'
from origin 'http://localhost:5173' has been blocked by CORS policy
```

**Solutions:**

1. Vérifier les origins dans `backend/app/core/config.py`:

   ```python
   CORS_ORIGINS=["http://localhost:5173", "http://localhost:3000"]
   ```

2. Redémarrer le backend après changement

3. Vérifier Authorization headers dans les requêtes API

---

### ❌ Expo Go Connection Error

**Error:**

```
Cannot connect to development server
```

**Solutions:**

1. Vérifier que le serveur Expo tourne:

   ```bash
   npm start
   ```

2. Vérifier l'adresse IP (pas localhost):

   ```bash
   # Expo affichera une URL comme:
   # exp://xxx.xxx.xxx.xxx:19000
   ```

3. Same network: le téléphone doit être sur le même WiFi

4. Firewall: autoriser le port 19000

5. Relancer Expo:
   ```bash
   npm start -- --reset-cache
   ```

---

## 🟡 API Issues

### ❌ 401 Unauthorized

**Error:**

```json
{ "detail": "Invalid authentication credentials" }
```

**Solutions:**

1. Vérifier le token JWT dans le header:

   ```
   Authorization: Bearer <token>
   ```

2. Token expiré? Utiliser /auth/refresh:

   ```bash
   curl -X POST http://localhost:8000/auth/refresh \
     -H "Content-Type: application/json" \
     -d '{"refresh_token":"..."}'
   ```

3. Tester login:
   ```bash
   curl -X POST http://localhost:8000/auth/login \
     -H "Content-Type: application/json" \
     -d '{"email":"doctor@test.com", "password":"password123"}'
   ```

---

### ❌ 403 Forbidden

**Error:**

```json
{ "detail": "Only doctors can access this endpoint" }
```

**Solutions:**

1. Vérifier le rôle du token (doctor/patient)

2. Décoder le token pour vérifier:

   ```bash
   # Utiliser https://jwt.io et coller le token
   ```

3. Créer un utilisateur avec le bon rôle:
   ```bash
   curl -X POST http://localhost:8000/auth/register \
     -H "Content-Type: application/json" \
     -d '{
       "email":"doctor@test.com",
       "password":"pass123",
       "full_name":"Dr. Test",
       "role":"doctor"
     }'
   ```

---

### ❌ 404 Not Found

**Error:**

```json
{ "detail": "Patient not found" }
```

**Solutions:**

1. Vérifier l'ID existe:

   ```bash
   curl http://localhost:8000/patients \
     -H "Authorization: Bearer <token>"
   ```

2. Vérifier le format UUID:

   ```bash
   # ID doit être un UUID valide
   ```

3. Vérifier les permissions (patient appartient au médecin)

---

### ❌ 422 Unprocessable Entity

**Error:**

```json
{ "detail": [{ "loc": ["body", "email"], "msg": "invalid email format" }] }
```

**Solutions:**

1. Valider les données envoyées (Pydantic schema)

2. Vérifier les types:

   ```python
   # String vs Number vs Boolean
   ```

3. Champs obligatoires manquants?

4. Vérifier la documentation OpenAPI:
   ```
   http://localhost:8000/docs
   ```

---

## 🔵 Database Issues

### ❌ Migration Problems

**Solutions:**

1. Les migrations SQLAlchemy se font automatiquement au démarrage

2. Si tables corrompues:
   ```bash
   psql -U username -d dermassist_db
   \dt  # List tables
   DROP TABLE public.users CASCADE;
   # Redémarrer le backend pour recréer
   ```

---

### ❌ Data Integrity Issues

**Solutions:**

1. Vérifier les contraintes FK:

   ```sql
   SELECT constraint_name FROM information_schema.table_constraints
   WHERE table_name='consultations';
   ```

2. Nettoyer les orphelins:
   ```sql
   DELETE FROM consultations WHERE patient_id NOT IN (SELECT id FROM patients);
   ```

---

## 📊 Debugging Tips

### Voir les logs SQL

```python
# Dans config.py
SQLALCHEMY_ECHO = True  # Shows all SQL queries
```

### Activez le Debug Mode

```bash
# .env
DEBUG=True
ENVIRONMENT=development
```

### Inspecter les requêtes API

```bash
# Voir tous les appels HTTP
curl -v http://localhost:8000/health
```

### Tester les endpoints avec Swagger

```
http://localhost:8000/docs
```

### Vérifier les tokens JWT

```bash
# Decode online at https://jwt.io
# Or via Python:
import jwt
jwt.decode(token, options={"verify_signature": False})
```

---

## 🚀 Performance Issues

### Lent au démarrage?

```bash
# Vérifier les imports
python -X dev main.py

# Profile startup
python -m cProfile -s cumtime main.py | head -20
```

### API lente?

```bash
# Ajouter timing logs
# Vérifier les requêtes BD avec SQL_ECHO=True
# Ajouter des indexes sur clés étrangères
```

---

## 📞 Getting Help

1. **Vérifier la documentation**: `README.md`, `docs/`
2. **Logs**: Lire les messages d'erreur complets
3. **Stack Overflow**: Chercher l'erreur exacte
4. **GitHub Issues**: Créer une issue détaillée

---

**Last Updated**: 24 Mars 2026
