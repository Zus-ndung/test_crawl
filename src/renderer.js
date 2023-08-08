document.getElementById('login').addEventListener('click', async () => {
    const username = document.getElementById('username').value
    const password = document.getElementById('password').value
    await window.app.authen(username, password)
})

document.getElementById('export').addEventListener('click', async () => {
    const startdate = document.getElementById('startdate').value
    const enddate = document.getElementById('enddate').value
    await window.app.crawl(startdate, enddate)
})
