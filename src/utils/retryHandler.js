const wait = (ms) => new Promise(resolve => setTimeout(resolve, ms));

async function retryOperation(operation, maxRetries = 3, delay = 1000) {
    let lastError;
    
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
        try {
            return await operation();
        } catch (error) {
            lastError = error;
            console.error(`Attempt ${attempt}/${maxRetries} failed:`, error.message);
            
            if (attempt < maxRetries) {
                await wait(delay * attempt); // Exponential backoff
                continue;
            }
            throw new Error(`Operation failed after ${maxRetries} attempts: ${error.message}`);
        }
    }
}

module.exports = { retryOperation };
