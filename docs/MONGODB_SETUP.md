# Configuração MongoDB Atlas + Railway

## 1. Obter a URI do MongoDB Atlas

**No MongoDB Atlas:**

1. Vá em **Clusters** → **Connect** → **Drivers**
2. Copie a connection string:
```
mongodb+srv://bruunieng_db_user:KBrMHlFoECoeVqan@seu-cluster.mongodb.net/?retryWrites=true&w=majority
```

3. Substitua a senha `KBrMHlFoECoeVqan` (ou deixe como está se for a mesma)

---

## 2. Configurar no Railway

**No Dashboard do Railway:**

1. Vá em **Variables** 
2. Adicione as seguintes variáveis:

| Chave | Valor | Descrição |
|-------|-------|-----------|
| `MONGODB_URI` | `mongodb+srv://bruunieng_db_user:KBrMHlFoECoeVqan@seu-cluster.mongodb.net/?retryWrites=true&w=majority` | Connection string do MongoDB Atlas |
| `LINKEDIN_CLIENT_SECRET` | `seu_secret_aqui` | LinkedIn OAuth Secret (recebido do LinkedIn Developer Console) |
| `NODE_ENV` | `production` | Ambiente de execução |

---

## 3. Whitelist de IP no MongoDB Atlas

**No MongoDB Atlas Atlas → Network Access:**

✅ _Já feito_ - Seu IP `189.63.35.130` foi adicionado

⚠️ **Importante para Railway:** Adicione também:
- **0.0.0.0/0** (todos os IPs) - necessário para Railway
  
Ou procure por uma opção de "Allow access from anywhere"

---

## 4. Testar a Conexão

Após fazer **Redeploy** no Railway, verifique os logs:

```
[Database] Connected to MongoDB Atlas
[Server] Database: MongoDB Atlas
```

Se ver:
```
[Database] MongoDB URI not configured, using local file storage
```

Significa que a variável `MONGODB_URI` não foi recebida pelo servidor.

---

## 5. Estrutura do Banco de Dados

O backend criará automaticamente:

| Banco | Coleção | Descrição |
|-------|---------|-----------|
| `janus-protocol` | `events` | Armazena eventos de telemetria |

Cada evento tem:
```json
{
  "_id": "ObjectId",
  "session_id": "string",
  "type_event": "collision|movement|interaction|etc",
  "timestamp": "ISO 8601",
  "user_id": "string",
  "payload": { ... }
}
```

---

## 6. Fallback para Local

Se `MONGODB_URI` não estiver configurado, o sistema usa arquivo JSON local:
```
backend/data/events.json
```

Útil para desenvolvimento local.

---

## ⚠️ Próximos Passos

1. Faça novo push do código
2. Aguarde GitHub Actions fazer o build
3. Railway fará Redeploy automático
4. Verifique os logs do Railway para confirmar conexão

🎉 Pronto! Seu backend agora suporta MongoDB Atlas!
