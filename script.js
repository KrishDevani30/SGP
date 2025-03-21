document.getElementById('checkButton').addEventListener('click', async function () {
    const fileInput = document.getElementById('fileInput');
    const titleInput = document.getElementById('titleInput');
    const resultList = document.getElementById('resultList');
    const anotherCheckButton = document.getElementById('anotherCheckButton');

    const file = fileInput.files[0];
    const title = titleInput.value.trim();

    if (!file) {
        alert('Please upload a file first!');
        return;
    }

    if (!title) {
        alert('Please enter a title to check!');
        return;
    }

    // Create FormData object
    const formData = new FormData();
    formData.append('titleFile', file);
    formData.append('userTitle', title);

    try {
        const response = await fetch('http://localhost:5000/upload-file', {
            method: 'POST',
            body: formData
        });

        const data = await response.json();

        if (response.ok) {
            const listItem = document.createElement('li');
            listItem.textContent = `"${title}" - ${data.duplicate ? 'Duplicate' : 'Unique'}`;
            listItem.style.color = data.duplicate ? 'red' : 'green';

            resultList.appendChild(listItem);
            titleInput.value = ''; // Clear input
            anotherCheckButton.style.display = 'block'; // Show "Check Another" button
        } else {
            alert('Error: ' + data.message);
        }
    } catch (error) {
        alert('There was an error communicating with the server.');
    }
});

// Fetch previous verified titles on page load
window.onload = async function () {
    const resultList = document.getElementById('resultList');
    try {
        const response = await fetch('http://localhost:5000/verified-titles');
        const titles = await response.json();

        titles.forEach(item => {
            const listItem = document.createElement('li');
            listItem.textContent = `"${item.title}" - ${item.duplicate ? 'Duplicate' : 'Unique'}`;
            listItem.style.color = item.duplicate ? 'red' : 'green';
            resultList.appendChild(listItem);
        });
    } catch (error) {
        console.error('Error fetching verified titles:', error);
    }
};

// "Check Another Title" button resets input
document.getElementById('anotherCheckButton').addEventListener('click', function () {
    document.getElementById('titleInput').value = '';
    document.getElementById('anotherCheckButton').style.display = 'none';
});
