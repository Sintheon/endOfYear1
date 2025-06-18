fetch('http://bankas.licejus.lt/bankas/api/transfer', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      senderId: 1,
      targetId: 1,
      amount: 1000
    })
  })
  .then(response => response.json())
  .then(data => console.log(data));