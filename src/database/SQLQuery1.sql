create table Pelicula(
 id_pelicula int IDENTITY(1,1) primary key,
 titulo varchar(100) NOT NULL,
 descripcion varchar(max),
 imagen varchar(max),
 duracion_min int
);


create table Sala(
id_sala int identity(1,1) primary key,
nombre varchar (15),
capacidad int
);

create table Asiento (
id_asiento int identity(1,1) primary key,
id_sala int NOT NULL,
fila char(1) NOT NULL,
numero int NOT NULL,
CONSTRAINT FK_Asiento_sala
FOREIGN KEY (id_sala) REFERENCES Sala(id_sala),
CONSTRAINT UQ_Asiento UNIQUE (id_sala, fila, numero)
);

create table Funcion (
id_funcion int identity(1,1) primary key,
id_pelicula int not null,
id_sala int not null,
fecha_hora DATETIME not null,
constraint FK_Funcion_Pelicula
	foreign key (id_pelicula) references Pelicula(id_pelicula),
constraint FK_Funcion_Sala
	foreign key (id_sala) references Sala(id_sala),

);


create table Usuario (
id_usuario int identity(1,1) primary key,
nombre varchar(50) not null,
correo varchar(100) unique,
contrasena varchar(200)
);

create table Boleto(
id_boleto int identity(1,1) primary key,
id_funcion int not null,
id_usuario int not null,
id_asiento int not null,
estado NVARCHAR(20) NOT NULL DEFAULT 'RESERVADO',
fecha_compra DATETIME DEFAULT GETDATE(),
constraint FK_Boleto_Funcion
	foreign key (id_funcion) references Funcion(id_funcion),
constraint FK_Boleto_Usuario
	foreign key (id_usuario) references Usuario(id_usuario),
constraint FK_Boleto_Asiento 
	foreign key (id_asiento) references Asiento(id_asiento),
constraint UQ_Boleto UNIQUE (id_funcion, id_asiento)
);



INSERT INTO Sala (nombre, capacidad)
VALUES 
('Sala 1', 100),
('Sala 2', 50),
('Sala 3', 70);

-- Asegurar que la tabla esté limpia antes de ejecutar esto
DELETE FROM Boleto;                
DELETE FROM Asiento;
DBCC CHECKIDENT ('Asiento', RESEED, 0);
GO

-- Variables para el control de bucles
DECLARE @id_sala INT;
DECLARE @capacidad INT;
DECLARE @fila_actual INT;
DECLARE @asiento_actual INT;
DECLARE @letra_fila CHAR(1);
DECLARE @total_filas INT = 10; -- Definimos 10 filas por sala

-- Cursor para recorrer las 3 salas
DECLARE cursor_salas CURSOR FOR
SELECT id_sala, capacidad FROM Sala WHERE id_sala IN (1, 2, 3);

OPEN cursor_salas;
FETCH NEXT FROM cursor_salas INTO @id_sala, @capacidad;

WHILE @@FETCH_STATUS = 0
BEGIN
    SET @fila_actual = 1;
    
    -- Bucle por fila
    WHILE @fila_actual <= @total_filas
    BEGIN
        SET @letra_fila = CHAR(64 + @fila_actual); -- 'A', 'B', 'C', etc.
        SET @asiento_actual = 1;
        
        -- Bucle por asiento dentro de la fila
        WHILE @asiento_actual <= (@capacidad / @total_filas)
        BEGIN
            INSERT INTO Asiento (id_sala, fila, numero)
            VALUES (@id_sala, @letra_fila, @asiento_actual);
            
            SET @asiento_actual = @asiento_actual + 1;
        END
        
        SET @fila_actual = @fila_actual + 1;
    END

    FETCH NEXT FROM cursor_salas INTO @id_sala, @capacidad;
END

CLOSE cursor_salas;
DEALLOCATE cursor_salas;
GO

-- Verificar resultado
SELECT id_sala, COUNT(*) as total_asientos 
FROM Asiento 
GROUP BY id_sala;

SELECT * FROM Asiento WHERE id_sala = 3;


Select * from Pelicula, Funcion where Pelicula.id_pelicula = Funcion.id_pelicula;

INSERT INTO Funcion (id_pelicula, id_sala, fecha_hora)
VALUES (7, 1, '2026-02-15 20:00:00');


SELECT 
        p.id_pelicula, p.titulo, p.descripcion, p.imagen, p.duracion_min,
        f.id_funcion, f.id_sala, f.fecha_hora, s.nombre AS Sala
    FROM Pelicula p
        INNER JOIN Funcion f ON p.id_pelicula = f.id_pelicula 
        INNER JOIN Sala s ON f.id_sala = s.id_sala
        WHERE p.id_pelicula = 7;

--and Funcion.fecha_hora > GETDATE() order by Funcion.fecha_hora asc;


INSERT INTO Boleto (id_funcion, id_usuario, id_asiento)
VALUES (1, 1, 1); -- Insertar un boleto para la función 1, usuario 1 y asiento 1

INSERT INTO Usuario (nombre, correo, contrasena)
VALUES ('Juan Pérez', 'juan.perez@example.com', 'contrasena123');

SELECT 
  a.id_asiento,
  a.fila + CAST(a.numero AS varchar) AS asiento,
  b.id_boleto
FROM Asiento a
LEFT JOIN Boleto b ON a.id_asiento = b.id_asiento 
  AND b.id_funcion = 1  
INNER JOIN Sala s ON a.id_sala = s.id_sala
WHERE s.id_sala = 1  
AND b.id_boleto IS NULL;  


SELECT 
  a.id_asiento,
  a.fila + CAST(a.numero AS varchar) AS asiento
FROM Funcion f
INNER JOIN Asiento a ON a.id_sala = f.id_sala
LEFT JOIN Boleto b ON a.id_asiento = b.id_asiento AND b.id_funcion = f.id_funcion
WHERE f.id_funcion = 2 
  AND b.id_boleto IS NULL; 
