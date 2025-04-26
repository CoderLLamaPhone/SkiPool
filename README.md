# SkiPool

SkiPool is a web application designed to connect skiers and snowboarders who want to share rides to mountain resorts. Users can create or join carpools to their favorite ski destinations, helping to reduce traffic, save on gas and parking costs, and meet fellow snow sports enthusiasts.

## Contributors
* Manav Shah
* Kerem Gurkan
* Jeremy Huang
* Colin Wallace
* Shane Wierl
* Rogan Tinjum

## Project Overview

SkiPool addresses the common problem of transportation to ski resorts by creating a platform where users can:
- Create carpool listings with details like departure location, time, vehicle capacity, and destination resort
- Search and filter available carpools based on location, date, and resort
- Join existing carpools and text over the platform
- Rate their carpool experiences
- View user profiles and driving history

### Technology Stack

- **Frontend**: HTML, CSS, JavaScript, Bootstrap 5
- **Backend**: Node.js, Express.js
- **Database**: PostgreSQL
- **Template Engine**: Handlebars
- **Version Control**: Git/GitHub

## Prerequisites to run the application

1. Node.js
2. npm
3. PostgreSQL
4. Docker

## Instructions on how to run locally

1. Clone the repository:
    ```
    git clone https://github.com/CoderLLamaPhone/SkiPool.git
    cd SkiPool/ProjectSourceCode
    ```

2. Create and modify .env file:
    - In the ProjectSourceCode folder create an `.env` file using
            ```
            touch .env
            ```
    - Modify the new .env file to contain the following variables:
      ```
      DB_HOST=localhost
      DB_PORT=5432
      DB_NAME=skipool
      DB_USER=postgres
      DB_PASSWORD=your_password
      PORT=3000
      SESSION_SECRET=your_session_secret
      ```
3. Set up Docker Container:
        ```
        docker compose up
        ```

6. Access the application in your browser at `http://localhost:3000`

## Instructions on how to run tests

1. If you have previously composed this specific docker container, it is suggested that you first docker compose down and remove the relevant tables as they are persistent:

2. Next modify the `docker-compose.yaml` file so it looks like this:
    ```
    services:
        db:
            image: postgres:14
            env_file: .env
            expose:
            - '5432'
        volumes:
        - group-project:/var/lib/postgresql/data
        - ./src/init_data/create.sql:/docker-entrypoint-initdb.d/01-create.sql
        - ./src/init_data/insert.sql:/docker-entrypoint-initdb.d/02-insert.sql
    web:
        image: node:lts
        user: 'node'
        working_dir: /repository
        env_file: .env
        environment:
        - NODE_ENV=development
        depends_on:
        - db
        ports:
        - '3000:3000'
        volumes:
        - ./:/repository
        command: 'npm testandrun'
    volumes:
        group-project:
    ```
3. To run the tests you can now run your docker container--succesful tests will be printed to the terminal:
    ```
    docker compose up
    ```

## Link to deployed application

[skipool.onrender.com](https://skipool.onrender.com/)

*Please be aware that this deployment is only valid until 5/16/2025*
