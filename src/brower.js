const webdriver = require('selenium-webdriver');
const {Options} = require('selenium-webdriver/chrome.js')
const fs = require('fs');


var driver
var config = {
	"url": "https://www.odoo.com/my/leads",
	"xpath_username": "//input[@id='login']",
	"xpath_password": "//input[@id='password']",
	"xpath_submit": "//button[@type='submit']",
	"xpath_mfa": "//input[@id='totp_token']",
	"xpath_rows": "//table[contains(@class, 'table ')]/tbody/tr",
	"xpath_next": "//li[not(contains(@class, 'disabled'))]/a[contains(@class,'page-link') and text()='Next']",
	"elements": [
		{
			"name": "name",
			"xpath": "//address[not(@itemtype='http://schema.org/Organization')]/div/span[@itemprop='name']",
			"regex": {
				"pattern": "",
				"regexid": ""
			}
		},
		{
			"name": "telephone",
			"xpath": "//address[not(@itemtype='http://schema.org/Organization')]/div/span[@itemprop='telephone']",
			"regex": {
				"pattern": "",
				"regexid": ""
			}
		},
		{
			"name": "email",
			"xpath": "//address[not(@itemtype='http://schema.org/Organization')]/div/span[@itemprop='email']",
			"regex": {
				"pattern": "",
				"regexid": ""
			}
		},
		{
			"name": "address",
			"xpath": "//label[text()='Address']/following-sibling::address",
			"regex": {
				"pattern": "",
				"regexid": ""
			}
		}
	]
}
const lanchChomre = async () => {
    const options = new Options()
    options.addArguments('--disable-dev-shm-usage')
    options.addArguments('--no-sandbox')
    options.addArguments('--headless')
    options.addArguments('--user-agent=Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/104.0.5112.79 Safari/537.36')
    options.addArguments('--blink-settings=imagesEnabled=false')
    options.addArguments('--lang=en-US')
    options.addArguments('--disable-dev-shm-usage')

    driver = new webdriver.Builder()
    .forBrowser(webdriver.Browser.CHROME)
        .setChromeOptions(
        options
    )
        .build();
    await driver.get(config.url)

}

const close = async () => {
    if (driver) {
        await driver.quit()
        driver = undefined
    }
}

const readFileConfig = () => {
    let data = "{}"
    try {
        data = fs.readFileSync('config.json', 'utf8');
    } catch (err) {
        console.error(err);
        return
    }
    config = JSON.parse(data)
}

const authen = async (username, password) => {
    const userNameElement = await driver.findElement(webdriver.By.xpath(config.xpath_username))
    if (!userNameElement) {
        console.log("username not found")
        return
    }
    const passwordElement = await driver.findElement(webdriver.By.xpath(config.xpath_password))
    if (!passwordElement) {
        console.log("password not found")
        return
    }
    await userNameElement.clear()
    await passwordElement.clear()
    await userNameElement.sendKeys(username)
    await passwordElement.sendKeys(password)

    const submitElement = await driver.findElement(webdriver.By.xpath(config.xpath_submit))
    if (!submitElement) {
        console.log("submit button not found")
        return
    }
    await submitElement.sendKeys(webdriver.Key.ENTER)
    const new_url = await driver.getCurrentUrl()
    if (new_url !== config.url) {
        return false
    }
    return true
}

const crawl = async (startdate, enddate) => {
    const datas = []
    while (true) {
        const rows = await driver.findElements(webdriver.By.xpath(config.xpath_rows))
        const regex_date = /\d+\/\d+\/\d+/
        let start_date_inc = new Date(startdate)
        let end_date_inc = new Date(enddate)
        const href_regex = /(?<=href=").+(?=")/

        for (let i = 0; i < rows.length; i++) {
            const row = rows[i]
            const data_raw = await row.getText()
            const found = data_raw.match(regex_date);
            if (found && found.length > 0) {
                let row_date = new Date(found[0])
                if (start_date_inc <= row_date && row_date <= end_date_inc) {
                    const innerHTML = await row.getAttribute("innerHTML")
                    const found = innerHTML.match(href_regex);
                    if (found && found.length > 0) {
                        const href = found[0]
                        await driver.executeScript(`window.open('${href}', '_blank')`)
                        const handles  = await driver.getAllWindowHandles()
                        await driver.switchTo().window(handles[1])
                        const data = await get_data()
                        datas.push(data)
                        await driver.close()
                        await driver.switchTo().window(handles[0])
                    }
                } 
            }
        }
        
        try {
            const next_element = await driver.findElements(webdriver.By.xpath(config.xpath_next))
            if (!next_element) {
                break
            }
            await next_element.click()
        } catch (error) {
            break
        }
    }
    
    const keys = []
    for (let i = 0; i < config.elements.length; i++) {
        keys.push(config.elements[i].name)
    }
    return [datas, keys]
}
const get_data = async () => {
    const data = {}
    const elements = config.elements;

    for (let i = 0; i < elements.length; i++) {
        const element = elements[i]
        let xpath_element = element.xpath
        let data_element
        try {
            data_element = await driver.findElement(webdriver.By.xpath(xpath_element))
        } catch (error) {
            data[element.name] = ""
            continue
        }
        if (data_element) {
            let data_text = await data_element.getText()
            data_text = data_text.trim()
            if (element.pattern) {
                const found = data_text.match(element.pattern)
                if (found && found.length > 0) {
                    data_text = found[0].trim()
                }
            }
            data[element.name] = data_text
        } 
    }
    return data
}


module.exports = {
    lanchChomre,
    close,
    authen,
    crawl
}