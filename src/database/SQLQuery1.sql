create table Movie(
 id_movie int IDENTITY(1,1) primary key,
 title varchar(100) NOT NULL,
 description varchar(max),
 image varchar(max),
 duration_min int
);


create table Room(
id_room int identity(1,1) primary key,
name varchar (15),
capacity int
);

create table Seat (
id_seat int identity(1,1) primary key,
id_room int NOT NULL,
row char(1) NOT NULL,
number int NOT NULL,
CONSTRAINT FK_Seat_room
FOREIGN KEY (id_room) REFERENCES Room(id_room),
CONSTRAINT UQ_Seat UNIQUE (id_room, row, number)
);

create table Show (
id_show int identity(1,1) primary key,
id_movie int not null,
id_room int not null,
date_time DATETIME not null,
constraint FK_Show_Movie
	foreign key (id_movie) references Movie(id_movie),
constraint FK_Show_Room
	foreign key (id_room) references Room(id_room),

);


create table User (
id_user int identity(1,1) primary key,
name varchar(50) not null,
email varchar(100) unique,
password varchar(200)
);

create table Ticket(
id_ticket int identity(1,1) primary key,
id_show int not null,
id_user int not null,
id_seat int not null,
status NVARCHAR(20) NOT NULL DEFAULT 'RESERVED',
purchase_date DATETIME DEFAULT GETDATE(),
constraint FK_Ticket_Show
	foreign key (id_show) references Show(id_show),
constraint FK_Ticket_User
	foreign key (id_user) references User(id_user),
constraint FK_Ticket_Seat 
	foreign key (id_seat) references Seat(id_seat),
constraint UQ_Ticket UNIQUE (id_show, id_seat)
);



INSERT INTO Room (name, capacity)
VALUES 
('Room 1', 100),
('Room 2', 50),
('Room 3', 70);

-- Asegurar que la tabla esté limpia antes de ejecutar esto
DELETE FROM Ticket;                
DELETE FROM Seat;
DBCC CHECKIDENT ('Seat', RESEED, 0);
GO

-- Variables para el control de bucles
DECLARE @id_room INT;
DECLARE @capacity INT;
DECLARE @row_current INT;
DECLARE @seat_current INT;
DECLARE @letter_row CHAR(1);
DECLARE @total_rows INT = 10; -- Definimos 10 filas por sala

-- Cursor para recorrer las 3 salas
DECLARE cursor_rooms CURSOR FOR
SELECT id_room, capacity FROM Room WHERE id_room IN (1, 2, 3);

OPEN cursor_rooms;
FETCH NEXT FROM cursor_rooms INTO @id_room, @capacity;

WHILE @@FETCH_STATUS = 0
BEGIN
    SET @row_current = 1;
    
    -- Bucle por fila
    WHILE @row_current <= @total_rows
    BEGIN
        SET @letter_row = CHAR(64 + @row_current); -- 'A', 'B', 'C', etc.
        SET @seat_current = 1;
        
        -- Bucle por asiento dentro de la fila
        WHILE @seat_current <= (@capacity / @total_rows)
        BEGIN
            INSERT INTO Seat (id_room, row, number)
            VALUES (@id_room, @letter_row, @seat_current);
            
            SET @seat_current = @seat_current + 1;
        END
        
        SET @row_current = @row_current + 1;
    END

    FETCH NEXT FROM cursor_rooms INTO @id_room, @capacity;
END

CLOSE cursor_rooms;
DEALLOCATE cursor_rooms;
GO

-- Verificar resultado
SELECT id_room, COUNT(*) as total_seats 
FROM Seat 
GROUP BY id_room;

SELECT * FROM Seat WHERE id_room = 3;


Select * from Movie, Show where Movie.id_movie = Show.id_movie;

INSERT INTO Show (id_movie, id_room, date_time)
VALUES (7, 1, '2026-02-15 20:00:00');


SELECT 
        p.id_movie, p.title, p.description, p.image, p.duration_min,
        f.id_show, f.id_room, f.date_time, s.name AS Room
    FROM Movie p
        INNER JOIN Show f ON p.id_movie = f.id_movie 
        INNER JOIN Room s ON f.id_room = s.id_room
        WHERE p.id_movie = 7;

--and Show.date_time > GETDATE() order by Show.date_time asc;


INSERT INTO Ticket (id_show, id_user, id_seat)
VALUES (1, 1, 1); -- Insertar un boleto para la función 1, usuario 1 y asiento 1

INSERT INTO User (name, email, password)
VALUES ('Juan Pérez', 'juan.perez@example.com', 'contrasena123');

SELECT 
  a.id_seat,
  a.row + CAST(a.number AS varchar) AS seat,
  b.id_ticket
FROM Seat a
LEFT JOIN Ticket b ON a.id_seat = b.id_seat 
  AND b.id_show = 1  
INNER JOIN Room s ON a.id_room = s.id_room
WHERE s.id_room = 1  
AND b.id_ticket IS NULL;  


SELECT 
  a.id_seat,
  a.row + CAST(a.number AS varchar) AS seat
FROM Show f
INNER JOIN Seat a ON a.id_room = f.id_room
LEFT JOIN Ticket b ON a.id_seat = b.id_seat AND b.id_show = f.id_show
WHERE f.id_show = 2 
  AND b.id_ticket IS NULL; 



SELECT 
  f.id_show,
  COUNT(b.id_ticket) AS tickets_reserved,
  s.capacity - COUNT(b.id_ticket) AS seats_available
FROM Show f
INNER JOIN Room s ON f.id_room = s.id_room
LEFT JOIN Ticket b ON b.id_show = f.id_show 
  AND b.status = 'RESERVED' 
WHERE f.id_show = 1
GROUP BY f.id_show, f.date_time, s.name, s.capacity;



-- Renombrar tablas
EXEC sp_rename 'Pelicula', 'Movie';
EXEC sp_rename 'Sala', 'Room';
EXEC sp_rename 'Asiento', 'Seat';
EXEC sp_rename 'Funcion', 'Show';
EXEC sp_rename 'Usuario', 'User';
EXEC sp_rename 'Boleto', 'Ticket';

-- Renombrar columnas para Movie
EXEC sp_rename 'Movie.id_pelicula', 'id_movie', 'COLUMN';
EXEC sp_rename 'Movie.titulo', 'title', 'COLUMN';
EXEC sp_rename 'Movie.descripcion', 'description', 'COLUMN';
EXEC sp_rename 'Movie.imagen', 'image', 'COLUMN';
EXEC sp_rename 'Movie.duracion_min', 'duration_min', 'COLUMN';

-- Renombrar columnas para Room
EXEC sp_rename 'Room.id_sala', 'id_room', 'COLUMN';
EXEC sp_rename 'Room.nombre', 'name', 'COLUMN';
EXEC sp_rename 'Room.capacidad', 'capacity', 'COLUMN';

-- Renombrar columnas para Seat
EXEC sp_rename 'Seat.id_asiento', 'id_seat', 'COLUMN';
EXEC sp_rename 'Seat.id_sala', 'id_room', 'COLUMN';
EXEC sp_rename 'Seat.fila', 'row', 'COLUMN';
EXEC sp_rename 'Seat.numero', 'number', 'COLUMN';

-- Renombrar columnas para Show
EXEC sp_rename 'Show.id_funcion', 'id_show', 'COLUMN';
EXEC sp_rename 'Show.id_pelicula', 'id_movie', 'COLUMN';
EXEC sp_rename 'Show.id_sala', 'id_room', 'COLUMN';
EXEC sp_rename 'Show.fecha_hora', 'date_time', 'COLUMN';

-- Renombrar columnas para User
EXEC sp_rename 'User.id_usuario', 'id_user', 'COLUMN';
EXEC sp_rename 'User.nombre', 'name', 'COLUMN';
EXEC sp_rename 'User.correo', 'email', 'COLUMN';
EXEC sp_rename 'User.contrasena', 'password', 'COLUMN';

-- Renombrar columnas para Ticket
EXEC sp_rename 'Ticket.id_boleto', 'id_ticket', 'COLUMN';
EXEC sp_rename 'Ticket.id_funcion', 'id_show', 'COLUMN';
EXEC sp_rename 'Ticket.id_usuario', 'id_user', 'COLUMN';
EXEC sp_rename 'Ticket.id_asiento', 'id_seat', 'COLUMN';
EXEC sp_rename 'Ticket.estado', 'status', 'COLUMN';
EXEC sp_rename 'Ticket.fecha_compra', 'purchase_date', 'COLUMN';

-- Renombrar restricciones (constraints)
EXEC sp_rename 'Seat.FK_Asiento_sala', 'FK_Seat_room', 'INDEX';
EXEC sp_rename 'Seat.UQ_Asiento', 'UQ_Seat', 'INDEX';
EXEC sp_rename 'Show.FK_Funcion_Pelicula', 'FK_Show_Movie', 'INDEX';
EXEC sp_rename 'Show.FK_Funcion_Sala', 'FK_Show_Room', 'INDEX';
EXEC sp_rename 'Ticket.FK_Boleto_Funcion', 'FK_Ticket_Show', 'INDEX';
EXEC sp_rename 'Ticket.FK_Boleto_Usuario', 'FK_Ticket_User', 'INDEX';
EXEC sp_rename 'Ticket.FK_Boleto_Asiento', 'FK_Ticket_Seat', 'INDEX';
EXEC sp_rename 'Ticket.UQ_Boleto', 'UQ_Ticket', 'INDEX';