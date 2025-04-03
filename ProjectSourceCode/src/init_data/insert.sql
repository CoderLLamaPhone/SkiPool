-- Insert fake entries into the "user" table
INSERT INTO "user" (username, password, email) VALUES
('john_doe', 'password123', 'john.doe@fake.com'),
('jane_smith', 'securepass456', 'jane.smith@fake.com'),
('mike_brown', 'mikepass789', 'mike.brown@fake.com');

-- Insert fake entries into the driverInfo table
INSERT INTO driverInfo (username, AVG_Rating) VALUES
('john_doe', 5),
('jane_smith', 4);

-- Insert fake entries into the driverRatings table
INSERT INTO driverRatings (driverID, stars, message, reviewedBy, tripID, date) VALUES
(1, 5, 'Great driver!', 'mike_brown', 1, '2025-01-01'),
(2, 4, 'Good experience.', 'john_doe', 2, '2025-02-02');

-- Insert fake entries into the car table
INSERT INTO car (licensePlate, ownerID, make, model, color, carType, drivetrain) VALUES
('ABC123', 1, 'Toyota', 'Camry', 'Blue', 'Sedan', 'AWD'),
('XYZ789', 2, 'Honda', 'Civic', 'Red', 'Sedan', '4WD');

-- Insert fake entries into the riderInfo table
INSERT INTO riderInfo (username, AVG-Rating) VALUES
('mike_brown', 5),
('jane_smith', 4);

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
(2, 3, 'Vail', '09:00:00', '17:00:00', 40, 'Uptown', '2023-10-02', 'XYZ789');

-- Insert fake entries into the chatroom table
INSERT INTO chatroom (driver, passenger) VALUES
(1, 1),
(2, 2);

-- Insert fake entries into the resort table
INSERT INTO resort (name, location, pass) VALUES
('Aspen', 'Colorado', 'Ikon'),
('Vail', 'Colorado', 'Epic');

-- Insert fake entries into the message table
INSERT INTO message (chatroomID, date, time, user, message) VALUES
(1, '2023-10-01', '12:00:00', 'john_doe', 'Hello, are you ready for the trip?'),
(2, '2023-10-02', '13:00:00', 'jane_smith', 'Yes, I will be there on time.');