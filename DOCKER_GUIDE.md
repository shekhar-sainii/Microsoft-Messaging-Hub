# 🐳 Docker Ultimate Master Guide — Microsoft Messaging Hub

Ye guide aapko Docker ke basics se lekar enterprise-level concepts tak sab kuch samjhayegi.

---

## 🚀 1. Project Startup & Basic Commands

Ye commands aap daily use karenge:

-   **`docker compose --profile dev up --build`**: 
    - Full project start karta hai (including ngrok).
    - `--build` naye code changes ko incorporate karta hai.
-   **`docker compose down`**: Sab kuch band aur clean karne ke liye.
-   **`docker compose ps`**: Dekhne ke liye ki kaunse containers chal rahe hain.
-   **`docker compose logs -f backend`**: Backend ke live logs dekhne ke liye.
-   **`docker compose restart backend`**: Sirf backend ko refresh karne ke liye.

---

## 🏗️ 2. Core Architecture (The Big Four)

Enterprise level par Docker ko samajhne ke liye in 4 pillars ko samajhna zaroori hai:

1.  **Images (The Blueprint)**: Ye ek read-only template hota hai (jaise Windows ki ISO file).
2.  **Containers (The Instance)**: Jab aap Image ko "run" karte hain, toh wo Container banta hai.
3.  **Networks (The Bridge)**: Containers aapas mein kaise baat karte hain? Networks ke zariye.
4.  **Volumes (The Hard Drive)**: Database ka data hamesha ke liye save rakhne ke liye hum **Volumes** use karte hain.

---

## 🛠️ 3. Advanced Image & Container Management

-   **`docker images`**: Downloaded images ki list.
-   **`docker history <image_id>`**: Image kaise bani uski layers dekhna.
-   **`docker inspect <id>`**: Container ya image ki poori detail nikalna.
-   **`docker stats`**: **(Pro Tip)** Live monitor karna ki kitni RAM/CPU use ho rahi hai.
-   **`docker top <id>`**: Container ke andar ke processes dekhna.
-   **`docker exec -it <id> sh`**: Container ke terminal ke andar ghusna.

---

## 🌐 4. Networking & Volumes

-   **`docker network ls`**: Saare available networks dekhna.
-   **`docker network inspect <name>`**: Network ke andar kaunse containers hain ye dekhna.
-   **`docker volume ls`**: Saare storage volumes dekhna.
-   **`docker volume prune`**: Faltu storage saaf karna.
-   **`docker volume inspect <name>`**: Data ka actual path dekhna.

---

## 🧹 5. Maintenance & Cleanup (Aapne abhi chalaayi hain!)

-   **`docker system prune`**: Stopped containers, unused networks, aur dangling images ko delete karna.
-   **`docker builder prune`**: Build cache delete karna (fresh build ke liye zaroori).
-   **`docker system prune -a --volumes`**: **(Warning)** Sab kuch (including DB data) delete karne ke liye.

---

## 🚀 6. Enterprise Best Practices

1.  **Multi-stage Builds**: Small image size ke liye (Dockerfile mein Stage 1 aur 2).
2.  **Health Checks**: Taaki crash hone par Docker khud restart kar sake.
3.  **Environment Isolation**: Hamesha `.env` use karein, secrets code mein na rakhein.
4.  **Profiles**: Humne `dev` profile banaya hai taaki ngrok sirf zaroorat par chale.

---
*Developed by Antigravity AI — From Dev to DevOps Master.*
