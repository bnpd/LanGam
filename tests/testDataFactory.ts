const TESTUSERPASSWORD = 'testpassword123!';
const POCKETBASE_URL = 'http://127.0.0.1:8090'; // Use the test server URL

interface TestUser {
    email: string;
    password: string;
    id?: string;
}

/**
 * Creates a test user in the backend and returns their credentials.
 * If the user is already created, just returns the credentials.
 */
export async function createTestUser(): Promise<TestUser> {
    const currentTime = new Date().getTime();
    const user = {
        email: `testuser${currentTime}@example.com`,
        password: TESTUSERPASSWORD,
        passwordConfirm: TESTUSERPASSWORD
    };

    try {
        // Create new test user
        const createResponse = await fetch(`${POCKETBASE_URL}/api/collections/users/records`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(user)
        });
        
        if (!createResponse.ok) {
            throw new Error(`Failed to create user: ${createResponse.statusText}`);
        }
        await createResponse.json(); // Ensure the response is consumed

        // Login to get the auth token
        const loginResponse = await fetch(`${POCKETBASE_URL}/api/collections/users/auth-with-password`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                identity: user.email,
                password: user.password
            })
        });

        if (!loginResponse.ok) {
            throw new Error(`Failed to login: ${loginResponse.statusText}`);
        }

        const loginData = await loginResponse.json();
        
        return {
            email: user.email,
            password: user.password,
            id: loginData.record.id
        };
    } catch (error) {
        console.error('Error creating test user:', error);
        throw error;
    }
}

export { TESTUSERPASSWORD };
