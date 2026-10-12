# a07-2025

Docker Compose environment running two Node.js Express containers on Debian (node:20-bookworm-slim):

Unsecured Service (a07-vulnerable): Demonstrates common A07 flaws (plaintext passwords, weak sessions in URLs, session fixation, and zero brute-force protection).

Secured Service (a07-secure): Implements OWASP-recommended mitigations (bcrypt hashing, rate-limiting, hardened HttpOnly cookie-based sessions, and session regeneration).