-- Insert fake entries into the "user" table
INSERT INTO "user" (username, password, email, about_me, epic_pass, ikon_pass, fav_mountains) VALUES
('john_doe', '$2a$10$XPktaBSFAOis4TbohF1F1e9avYUKNqXZ3VujnFjSrK1tDtHRL8oDy', 'john.doe@fake.com', 'I just love snowboarding so much, and I am incredibly grateful this app is allowing me to make friends in the process. Yew!!', true, true, 'Aspen, Breckenridge'),
('jane_smith', '$2a$10$1ft5g8Bp0D5YMufp.xg11.W.fukeiwCvEL7fuP6qij8.ODsgG13O.', 'jane.smith@fake.com', 'Skiing is my passion. Vail is home.', true, false, 'Vail'),
('mike_brown', '$2a$10$aWR8.I8JXfHkhgCCUEMk0O3BQH34YYZKJ5i1P.hBIj3Fc6835Q8oO', 'mike.brown@fake.com', 'Looking to make new friends through weekend trips.', false, true, 'Copper Mountain');

-- Insert fake entries into the driverInfo table
INSERT INTO driverInfo (username, AVG_Rating) VALUES
('john_doe', 4),
('jane_smith', 4);

-- Insert fake entries into the driverRatings table
INSERT INTO driverRatings (driverID, stars, message, reviewedBy, tripID, date) VALUES
(1, 5, 'Great driver!', 'mike_brown', 1, '2025-01-01'),
(1, 3, 'Cool guy, lots of traffic though made for too long of a drive.', 'jane_smith', 1, '2025-01-01'),
(2, 4, 'Good experience.', 'john_doe', 2, '2025-02-02');

-- Insert fake entries into the car table
INSERT INTO car (licensePlate, ownerID, make, model, color, carType, drivetrain) VALUES
('ABC123', 1, 'Toyota', 'Camry', 'Blue', 'Sedan', 'AWD'),
('XYZ789', 2, 'Honda', 'Civic', 'Red', 'Sedan', '4WD');

-- Insert fake entries into the riderInfo table
INSERT INTO riderInfo (username, AVG_Rating) VALUES
('john_doe', 4),
('mike_brown', 5),
('jane_smith', 4);
=======
INSERT INTO riderInfo (riderID, username, AVG_Rating) VALUES
(1, 'mike_brown', 5),
(2, 'jane_smith', 4);


-- Insert fake entries into the riderRatings table
INSERT INTO riderRatings (riderID, stars, message, reviewedBy, tripID, date) VALUES
(1, 5, 'Very polite rider.', 'john_doe', 1, '2025-01-01'),
(2, 4, 'Good rider.', 'jane_smith', 2, '2025-01-02');

-- Insert fake entries into the passengers table
INSERT INTO passengers (tripID, passenger) VALUES
(1, 1),
(2, 2);

-- Insert fake entries into the trips table
INSERT INTO trips (driverID, capacity, resort, EST_outbound, EST_return, cost, pickupLocation, date, car) VALUES
(1, 4, 'Aspen', '08:00:00', '18:00:00', 50, 'Downtown', '2023-10-01', 'ABC123'),
(1, 4, 'Breckenridge', '08:00:00', '18:00:00', 40, 'Ball Arena', '2025-12-25', 'ABC123'),
(2, 3, 'Vail', '09:00:00', '17:00:00', 40, 'Uptown', '2023-10-02', 'XYZ789');

-- Insert fake entries into the chatroom table
INSERT INTO chatroom (driver, passenger) VALUES
(1, 1),
(2, 2);

-- Insert fake entries into the resort table
INSERT INTO resort (name, location, pass) VALUES
('Aspen', 'Colorado', 'Ikon'),
('Snowmass', 'Colorado', 'Ikon'),
('Winter Park', 'Colorado', 'Ikon'),
('Steamboat', 'Colorado', 'Ikon'),
('Copper Mountain', 'Colorado', 'Ikon'),
('Eldora', 'Colorado', 'Ikon'),
('Arapahoe Basin', 'Colorado', 'Ikon'),
('Vail', 'Colorado', 'Epic'),
('Beaver Creek', 'Colorado', 'Epic'),
('Breckenridge', 'Colorado', 'Epic'),
('Keystone', 'Colorado', 'Epic'),
('Crested Butte', 'Colorado', 'Epic');

-- Insert fake entries into the message table
INSERT INTO message (chatroomID, date, time, username, message) VALUES
(1, '2023-10-01', '12:00:00', 'john_doe', 'Hello, are you ready for the trip?'),
(2, '2023-10-02', '13:00:00', 'jane_smith', 'Yes, I will be there on time.');