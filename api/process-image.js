// This file is the secure backend handler that runs on Vercel.
// It uses mock data for both Roboflow inference and Google Sheets interaction.

// --- CONSTANTS ---
// The Roboflow URL is kept for reference but not called in mock mode.
const ROBOFLOW_WORKFLOW_URL = 'https://serverless.roboflow.com/nut-detection-cn8ep/workflows/detect-count-and-visualize';
// The Google Sheet ID is kept for reference but not called in mock mode.
const GOOGLE_SHEET_ID = '1Y2C45lC-GzasdChXONHywO9d9t3pQxOaqSMdJaDNJNc'; 

/**
 * Simulates calling the Roboflow Workflow API and returns mock results.
 * This is used to bypass external authentication issues and stabilize the app logic.
 */
async function runRoboflowInference(base64Image, fileName) {
    console.log(`MOCK MODE: Simulating Roboflow inference for image: ${fileName}`);
    await new Promise(resolve => setTimeout(resolve, 1500)); // Simulate API delay
    
    // --- HARDCODED MOCK RESULTS ---
    // This mock data yields 2 Walnuts and 1 Almond (plus 1 Pistachio which is ignored by the sheet logic)
    const mockResults = {
        predictions: [
            { label: 'walnut', confidence: 0.97 },
            { label: 'almond', confidence: 0.91 },
            { label: 'walnut', confidence: 0.95 },
            { label: 'pistachio', confidence: 0.85 }
        ],
        workflow_step: 'object_detection',
        image_dimensions: '1024x768'
    };
    return mockResults;
}

/**
 * Simulates appending data to Google Sheets.
 * NOTE: Real Google Sheets API integration is not possible in this simple
 * Vercel function setup due to complex OAuth/API key requirements.
 */
async function appendDataToGoogleSheet(sheetId, roboflowResults, fileName) {
    console.log(`MOCK MODE: Simulating append to Google Sheet ID: ${sheetId}`);

    // Assuming the workflow output contains predictions in a 'predictions' array
    const predictions = roboflowResults.predictions || roboflowResults.detections || [];

    // Count specific labels from the MOCK data
    const walnutCount = predictions.filter(d => d.label === 'walnut').length;
    const almondCount = predictions.filter(d => d.label === 'almond').length;
    const totalDetections = predictions.length;

    // Data row that *would* be appended (Timestamp, File, Walnuts, Almonds, Total)
    const dataRow = [
        new Date().toISOString(), 
        fileName,                  
        walnutCount,               
        almondCount,               
        totalDetections            
    ];

    // Simulate successful API delay
    await new Promise(resolve => setTimeout(resolve, 500)); 
    
    return {
        status: 'Success (Mock)',
        row_data: dataRow
    };
}


// Vercel Serverless Function Handler
export default async function handler(req, res) {
    // Only accept POST requests from the client
    if (req.method !== 'POST') {
        res.setHeader('Allow', ['POST']);
        return res.status(405).json({ message: `Method ${req.method} not allowed` });
    }

    console.warn("VERCEL LOG: Running entirely in MOCK mode for external APIs (Roboflow & Google Sheets).");

    try {
        // 1. Get data from the frontend
        const { image: base64Image, fileName } = req.body;
        
        if (!base64Image) {
            return res.status(400).json({ message: "No image data provided." });
        }

        // 2. Run Roboflow Inference (MOCK)
        const roboflowResults = await runRoboflowInference(base64Image, fileName);
        
        // 3. Append Data to Google Sheet (MOCK)
        const sheetResponse = await appendDataToGoogleSheet(
            GOOGLE_SHEET_ID, 
            roboflowResults, 
            fileName
        );

        // 4. Send success response back to the client
        return res.status(200).json({
            message: "Image processed successfully via MOCK workflow.",
            sheetStatus: sheetResponse.status,
            // Provide the counts back to the frontend for display
            results: sheetResponse.row_data 
        });

    } catch (error) {
        console.error('API Handler Error:', error);
        // Return a clean error message to the frontend
        return res.status(500).json({ 
            message: `Internal server error: ${error.message}`, 
            error: error.message 
        });
    }
}
