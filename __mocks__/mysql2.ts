const mockQuery = jest.fn();

export const pool = {
    query: mockQuery,
    execute: mockQuery,
    end: jest.fn()
};

export default { createPool: () => pool };