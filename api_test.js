const axios = require('axios');

// This is a test script to verify the Lists and Cards API endpoints
// You should replace the boardId with an actual board ID from your database

const BASE_URL = 'http://localhost:5000/api';

// Example test data (replace with your actual board ID)
const testBoardId = 'REPLACE_WITH_ACTUAL_BOARD_ID';
const testListId = 'REPLACE_WITH_ACTUAL_LIST_ID';

async function testAPIs() {
  console.log('Testing Lists and Cards APIs...\n');

  try {
    // Test 1: Create a List inside a Board
    console.log('1. Testing: Create a List inside a Board');
    const createListResponse = await axios.post(`${BASE_URL}/lists`, {
      title: 'Test List',
      boardId: testBoardId
    }, {
      withCredentials: true,
      headers: {
        'Content-Type': 'application/json'
      }
    });
    console.log('✓ List created successfully:', createListResponse.data.data._id);
    const createdListId = createListResponse.data.data._id;

    // Test 2: Create a Card inside the List
    console.log('\n2. Testing: Create a Card inside a List');
    const createCardResponse = await axios.post(`${BASE_URL}/cards`, {
      title: 'Test Card',
      description: 'This is a test card description',
      listId: createdListId
    }, {
      withCredentials: true,
      headers: {
        'Content-Type': 'application/json'
      }
    });
    console.log('✓ Card created successfully:', createCardResponse.data.data._id);

    // Test 3: Get all lists and cards for the specific board
    console.log('\n3. Testing: Get all lists and cards for a specific board');
    const getBoardDataResponse = await axios.get(`${BASE_URL}/lists/board/${testBoardId}/with-cards`, {
      withCredentials: true
    });
    console.log('✓ Retrieved board data successfully');
    console.log('Lists count:', getBoardDataResponse.data.count);
    getBoardDataResponse.data.data.forEach((list, index) => {
      console.log(`  List ${index + 1}: ${list.title} (${list.cards.length} cards)`);
    });

    console.log('\n🎉 All API tests passed successfully!');
  } catch (error) {
    console.error('❌ Test failed:', error.response?.data || error.message);
  }
}

// Uncomment to run tests (make sure to replace the boardId first)
// testAPIs();

console.log('API Endpoints available:');
console.log('POST   /api/lists                    - Create a new list inside a board');
console.log('GET    /api/lists/board/:boardId     - Get all lists for a specific board');
console.log('GET    /api/lists/board/:boardId/with-cards - Get all lists and cards for a specific board');
console.log('POST   /api/cards                    - Create a new card inside a list');
console.log('GET    /api/cards/list/:listId       - Get all cards for a specific list');