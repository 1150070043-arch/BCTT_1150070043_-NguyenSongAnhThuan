DECLARE @PasswordHash nvarchar(max) = N'jZae727K08KaOmKSgOaGzww/XVqGr/PKEgIMkjrcbJI='; -- 123456
DECLARE @Now datetime2 = SYSUTCDATETIME();

IF EXISTS (SELECT 1 FROM Users WHERE Email = N'sales@ngocanhphuthinh9.vn')
BEGIN
    UPDATE Users
    SET FullName = N'Kho vận Thủ Đức',
        PhoneNumber = COALESCE(NULLIF(PhoneNumber, N''), N'0901000001'),
        Address = N'Thủ Đức, TP. Hồ Chí Minh',
        Role = N'Provider',
        IsActive = 1,
        UpdatedAt = @Now
    WHERE Email = N'sales@ngocanhphuthinh9.vn';

    UPDATE Suppliers
    SET SupplierName = N'Ngoc Anh Phu Thinh 9 - Phan phoi nuoc da chi nhanh Thu Duc',
        Description = N'Kho vận chi nhánh Thủ Đức, phụ trách tồn kho và đơn khu vực Thủ Đức.',
        IsVerifiedSupplier = 1,
        UpdatedAt = @Now
    WHERE UserId = (SELECT TOP 1 Id FROM Users WHERE Email = N'sales@ngocanhphuthinh9.vn');
END;

IF NOT EXISTS (SELECT 1 FROM Users WHERE Email = N'khovan.phunhuan@ngocanhphuthinh9.vn')
BEGIN
    INSERT INTO Users (FullName, Email, PasswordHash, PhoneNumber, Address, Role, IsActive, CreatedAt)
    VALUES (N'Kho vận Phú Nhuận', N'khovan.phunhuan@ngocanhphuthinh9.vn', @PasswordHash, N'0901000002', N'Phú Nhuận, TP. Hồ Chí Minh', N'Provider', 1, @Now);

    INSERT INTO Suppliers (UserId, SupplierName, Description, CapabilitiesJson, Rating, CompletedOrders, IsVerifiedSupplier, CreatedAt)
    VALUES (SCOPE_IDENTITY(), N'Ngoc Anh Phu Thinh 9 - Phan phoi nuoc da chi nhanh Phu Nhuan', N'Kho vận chi nhánh Phú Nhuận, phụ trách tồn kho và đơn khu vực Phú Nhuận.', N'[]', 0, 0, 1, @Now);
END
ELSE
BEGIN
    UPDATE Users
    SET FullName = N'Kho vận Phú Nhuận',
        PasswordHash = @PasswordHash,
        PhoneNumber = COALESCE(NULLIF(PhoneNumber, N''), N'0901000002'),
        Address = N'Phú Nhuận, TP. Hồ Chí Minh',
        Role = N'Provider',
        IsActive = 1,
        UpdatedAt = @Now
    WHERE Email = N'khovan.phunhuan@ngocanhphuthinh9.vn';

    IF NOT EXISTS (SELECT 1 FROM Suppliers WHERE UserId = (SELECT TOP 1 Id FROM Users WHERE Email = N'khovan.phunhuan@ngocanhphuthinh9.vn'))
    BEGIN
        INSERT INTO Suppliers (UserId, SupplierName, Description, CapabilitiesJson, Rating, CompletedOrders, IsVerifiedSupplier, CreatedAt)
        SELECT TOP 1 Id, N'Ngoc Anh Phu Thinh 9 - Phan phoi nuoc da chi nhanh Phu Nhuan', N'Kho vận chi nhánh Phú Nhuận, phụ trách tồn kho và đơn khu vực Phú Nhuận.', N'[]', 0, 0, 1, @Now
        FROM Users
        WHERE Email = N'khovan.phunhuan@ngocanhphuthinh9.vn';
    END
    ELSE
    BEGIN
        UPDATE Suppliers
        SET SupplierName = N'Ngoc Anh Phu Thinh 9 - Phan phoi nuoc da chi nhanh Phu Nhuan',
            Description = N'Kho vận chi nhánh Phú Nhuận, phụ trách tồn kho và đơn khu vực Phú Nhuận.',
            IsVerifiedSupplier = 1,
            UpdatedAt = @Now
        WHERE UserId = (SELECT TOP 1 Id FROM Users WHERE Email = N'khovan.phunhuan@ngocanhphuthinh9.vn');
    END;
END;
