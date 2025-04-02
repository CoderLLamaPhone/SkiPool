INSERT INTO "user" (username, password, email)
VALUES ('john_doe', 'hashed_password', 'john.doe@example.com');

INSERT INTO driverInfo (username, avgRating)
VALUES ('john_doe', 4.2);

INSERT INTO trips (driverID, capacity, resort, estOutbound, estReturn, cost, pickupLocation, date, car)
VALUES 
(1, 4, 'Breckenridge', '08:00', '18:00', 25, 'Boulder, CO', '2025-01-15', 'ABC123'),
(1, 4, 'Vail', '07:30', '17:30', 30, 'Denver, CO', '2024-12-10', 'ABC123'),
(1, 3, 'Aspen', '06:45', '20:00', 40, 'Boulder, CO', '2025-02-20', 'ABC123'),
(1, 3, 'Telluride', '06:00', '21:00', 50, 'Denver, CO', '2025-03-15', 'ABC123');

INSERT INTO resort (name, location, pass)
VALUES 
('Breckenridge', 'CO', 'Ikon'),
('Vail', 'CO', 'Epic'),
('Aspen', 'CO', 'Ikon'),
('Telluride', 'CO', 'Ikon');

