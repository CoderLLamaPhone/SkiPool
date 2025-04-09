DROP TABLE IF EXISTS "user";
CREATE TABLE "users_db"(
    username VARCHAR(50) PRIMARY KEY,
    password VARCHAR(60) NOT NULL,
    email VARCHAR(200)
);

DROP TABLE IF EXISTS driverInfo;
CREATE TABLE driverInfo(
    driverID SERIAL PRIMARY KEY,
    username VARCHAR(60) NOT NULL,
    AVG_Rating FLOAT(10)
);

DROP TABLE IF EXISTS driverRatings;
CREATE TABLE driverRatings(
    ratingID SERIAL PRIMARY KEY,
    driverID INTEGER NOT NULL,
    stars INTEGER NOT NULL,
    message VARCHAR(300) NOT NULL,
    reviewedBy VARCHAR(50) NOT NULL,
    tripID INTEGER NOT NULL,
    date DATE NOT NULL
);

DROP TABLE IF EXISTS car;
CREATE TABLE car(
    licensePlate VARCHAR(50) PRIMARY KEY,
    ownerID INTEGER NOT NULL,
    make VARCHAR(50) NOT NULL,
    model VARCHAR(50) NOT NULL,
    color VARCHAR(50) NOT NULL,
    carType VARCHAR(50) NOT NULL,
    drivetrain VARCHAR(50) NOT NULL
);

DROP TABLE IF EXISTS riderInfo;
CREATE TABLE riderInfo(
    riderID SERIAL PRIMARY KEY,
    username VARCHAR(60) NOT NULL,
    AVG_Rating FLOAT(10)
);

DROP TABLE IF EXISTS riderRatings;
CREATE TABLE riderRatings(
    ratingID SERIAL PRIMARY KEY,
    riderID INTEGER NOT NULL,
    stars INTEGER NOT NULL,
    message VARCHAR(300) NOT NULL,
    reviewedBy VARCHAR(50) NOT NULL,
    tripID INTEGER NOT NULL,
    date DATE NOT NULL
);

DROP TABLE IF EXISTS passengers;
CREATE TABLE passengers(
    tripID INTEGER NOT NULL,
    passenger INTEGER NOT NULL
);

DROP TABLE IF EXISTS trips;
CREATE TABLE trips(
    tripID SERIAL PRIMARY KEY,
    driverID INTEGER NOT NULL,
    capacity INTEGER NOT NULL,
    resort VARCHAR(50) NOT NULL,
    EST_outbound TIME,
    EST_return TIME,
    cost INTEGER NOT NULL,
    pickupLocation VARCHAR(50) NOT NULL,
    date DATE NOT NULL,
    car VARCHAR(50) NOT NULL
);

DROP TABLE IF EXISTS chatroom;
CREATE TABLE chatroom(
    chatroomID SERIAL PRIMARY KEY,
    driver INTEGER NOT NULL,
    passenger INTEGER NOT NULL
);

DROP TABLE IF EXISTS resort;
CREATE TABLE resort(
    name VARCHAR(50) PRIMARY KEY,
    location VARCHAR(50) NOT NULL,
    pass VARCHAR(20) NOT NULL
);

DROP TABLE IF EXISTS message;
CREATE TABLE message(
    messageID SERIAL PRIMARY KEY,
    chatroomID INTEGER NOT NULL,
    date DATE NOT NULL,
    time TIME NOT NULL,
    username VARCHAR(50) NOT NULL,
    message VARCHAR(500) NOT NULL
);