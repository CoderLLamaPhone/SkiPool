-- Insert fake entries into the "user" table
INSERT INTO "user" (username, password, email) VALUES
('John Doe', '$2a$10$XPktaBSFAOis4TbohF1F1e9avYUKNqXZ3VujnFjSrK1tDtHRL8oDy', 'john.doe@fake.com'),
('Jane Smith', '$2a$10$1ft5g8Bp0D5YMufp.xg11.W.fukeiwCvEL7fuP6qij8.ODsgG13O.', 'jane.smith@fake.com'),
('Mike Brown', '$2a$10$aWR8.I8JXfHkhgCCUEMk0O3BQH34YYZKJ5i1P.hBIj3Fc6835Q8oO', 'mike.brown@fake.com');

-- Insert fake entries into the driverInfo table
INSERT INTO driverInfo (username, AVG_Rating) VALUES
('John Doe', 4),
('Jane Smith', 4);

-- Insert fake entries into the driverRatings table
INSERT INTO driverRatings (driverID, stars, message, reviewedBy, tripID, date) VALUES
(1, 5, 'Great driver!', 'Mike Brown', 1, '2025-01-01'),
(2, 4, 'Good experience.', 'John Doe', 2, '2025-02-02');

-- Insert fake entries into the car table
INSERT INTO car (licensePlate, ownerID, make, model, color, carType, drivetrain) VALUES
('ABC123', 1, 'Toyota', 'Camry', 'Blue', 'Sedan', 'AWD'),
('XYZ789', 2, 'Honda', 'Civic', 'Red', 'Sedan', '4WD');

-- Insert fake entries into the riderInfo table
INSERT INTO riderInfo (username, AVG_Rating) VALUES
('Mike Brown', 5),
('Jane Smith', 4);


-- Insert fake entries into the riderRatings table
INSERT INTO riderRatings (riderID, stars, message, reviewedBy, tripID, date) VALUES
(1, 5, 'Very polite rider.', 'John Doe', 1, '2025-01-01'),
(2, 4, 'Good rider.', 'Jane Smith', 2, '2025-01-02');

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
INSERT INTO chatroom (chatroomID) VALUES
(DEFAULT),
(DEFAULT);

-- Insert fake entries into the chatroomParticipants table
INSERT INTO chatroomParticipants (chatroomID, username) VALUES
(1, 'John Doe'),
(1, 'Mike Brown'),
(1, 'Jane Smith'),
(2, 'Jane Smith'),
(2, 'John Doe');

-- Insert fake entries into the message table
INSERT INTO message (chatroomID, date, time, username, message) VALUES
(1, '2023-10-01', '12:00:00', 'John Doe', 'Hello, are you ready for the trip?'),
(2, '2023-10-02', '13:00:00', 'Jane Smith', 'Yes, I will be there on time.');

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