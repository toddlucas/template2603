#!/bin/sh

TOKEN=$(curl -s -X POST http://localhost:8181/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"bb@example.com","password":"qw12QW!@"}' \
  | python3 -c "import sys,json; print(json.load(sys.stdin)['accessToken'])")

curl -X POST http://localhost:8181/api/projects/123e4567-e89b-12d3-a456-426614174000/documents \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"providerId":"my-doc.docx","name":"My Doc"}'
