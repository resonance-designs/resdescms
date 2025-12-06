#!/bin/bash
curl -X POST http://localhost:3001/api/auth/login \
  -H 'Content-Type: application/json' \
  -d '{"username":"resonancedesigns","password":"M@1phunkti0n!ng)"}'
