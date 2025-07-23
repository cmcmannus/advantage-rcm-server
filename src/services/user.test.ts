import {
    createUser,
    updateUser,
    deactivateUser,
    getUserById,
    loginUser,
} from "./users";
import { pool } from "../utils/db";
import { User } from "../../../shared/dist";

const PASSWORD = "hashedpass"; // Mocked password for testing

const mockUser: User = {
    id: 1,
    email: "test@example.com",
    first_name: "Test",
    last_name: "User",
    sales_rep: false,
    access_level: 2
};

jest.mock("../utils/db", () => ({
    pool: {
        query: jest.fn(),
        execute: jest.fn(),
    },
}));

describe("User Service", () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it("should call create_user stored procedure", async () => {
        (pool.query as jest.Mock).mockResolvedValue(mockUser);

        const result = await createUser({
            ...mockUser,
            password: PASSWORD
        });

        expect(pool.query).toHaveBeenCalledWith(
            "CALL create_user(?, ?, ?, ?, ?, ?)",
            [mockUser.email, PASSWORD, mockUser.first_name, mockUser.last_name, mockUser.sales_rep, mockUser.access_level]
        );
        expect(result).toEqual(mockUser);
    });

    it("should call update_user with nulls for missing fields", async () => {
        const updatedUser = {
            id: mockUser.id,
            first_name: "Updated"
        };
        
        (pool.query as jest.Mock).mockResolvedValue(updatedUser);

        const result = await updateUser(updatedUser);

        expect(pool.query).toHaveBeenCalledWith(
            "CALL update_user(?, ?, ?, ?, ?, ?, ?)",
            [1, null, null, "Updated", null, null, null]
        );
        expect(result).toEqual(updatedUser);
    });

    it("should call deactivate_user", async () => {
        await deactivateUser(1);

        expect(pool.execute).toHaveBeenCalledWith("CALL deactivate_user(?)", [1]);
    });

    it("should call get_user_by_id", async () => {
        const mockUser = [{ id: 1, email: "test@example.com" }];
        (pool.query as jest.Mock).mockResolvedValue([mockUser]);

        const result = await getUserById(1);

        expect(pool.query).toHaveBeenCalledWith("CALL get_user_by_id(?)", [1]);
        expect(result).toEqual(mockUser);
    });

    it("should call login_user", async () => {
        const { password, active, ...inner_mock } = mockUser;
        (pool.query as jest.Mock).mockResolvedValue(inner_mock);

        const result = await loginUser({
            email: mockUser.email,
            password: mockUser.password as string,
        });

        expect(pool.query).toHaveBeenCalledWith("CALL login_user(?, ?)", [mockUser.email, mockUser.password]);
        expect(result).toEqual(inner_mock);
    });
});