const Enums = {
    ROLE: {
        USER: 'user',
        ADMIN: 'admin',
    },
    PERMISSION: {
        READ: 'read',
        WRITE: 'write',
    },
    AUDIENCE: {
        UPI: 'UPI',
    },
    PAYMENT_STATUS: {
        PENDING: 'pending',
        SUCCESS: 'success',
        FAILED: 'failed',
        CANCELLED: 'cancelled',
    },
    TRANSACTION_STATUS: {
        PENDING: 'pending',
        SUCCESS: 'success',
        FAILED: 'failed',
        CANCELLED: 'cancelled',
    },
    TRANSACTION_TYPE: {
        SEND: 'send',
        RECEIVE: 'receive',
        REFUND: 'refund',
    },
    PAYMENT_PROVIDER: {
        RAZORPAY: 'RAZORPAY',
        CASHFREE: 'CASHFREE',
        INTERNAL: 'INTERNAL',
    },
};

export default Enums;
