async function postForData(endpoint, dict={}) {
    let response = await fetch(endpoint, {
        method: 'post',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(dict)
    });
    let data = await response.json();
    return data;
}

export {postForData};