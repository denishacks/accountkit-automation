const url = require('url');
const socketio = require('socket.io');
const {By, Builder, Condition, until} = require('selenium-webdriver');

module.exports = (server) => {
  const io = socketio(server);

  const locators = {
    phoneInput: By.css('input[name="phone_number"]'),
    sendSmsBtn: By.css('button[value="sms_login_confirmation_view"]:last-child'),
    sendWhatsappMsgBtn: By.css('button[value="sms_login_confirmation_view_with_whatsapp"]'),
    codeInput: By.css('input[name="confirmation_code"]'),
    codeForm: By.xpath('//input[@name="confirmation_code"]/ancestor::form'),
  };

  const sessions = new Map();

  async function close(id) {
    if (sessions.has(id)) {
      await sessions.get(id).close();
      sessions.delete(id);
    }
  }

  io.on('connection', async (socket) => {
    let code;
    let driver;

    socket.on('send', async ({prefix, phone}, cb) => {
      try {
        await close(socket.id);
        driver = await new Builder().forBrowser(process.env.DRIVER_NAME).build();
        sessions.set(socket.id, driver);
        await driver.get(`https://www.accountkit.com/v1.0/basic/dialog/sms_login/?app_id=${process.env.APP_ID}&redirect=http://localhost:3000/callback&state=${Date.now()}&country_code=${prefix}&phone_number=${phone}`);
        await driver.findElement(locators.sendSmsBtn).click();
        // await driver.findElement(locators.sendWhatsappMsgBtn).click();
        await driver.wait(until.elementLocated(locators.codeInput), 30000, 'Code input timeout');
        cb(null);
      } catch (err) {
        console.error(err.message, {'socket.id': socket.id});
        cb('Oops!');
      }
    });

    socket.on('confirm', async ({code}, cb) => {
      try {
        await driver.wait(new Condition('code', (driver) => Promise.resolve().
            then(() => code)), 60000);
        const codeInput = await driver.findElement(locators.codeInput);
        await codeInput.clear();
        await codeInput.sendKeys(code);
        await driver.findElement(locators.codeForm).submit();
        await driver.wait(until.urlContains('http://localhost:3000/success'), 30000, 'Success page timeout');
        const parsed = url.parse(await driver.getCurrentUrl(), true);
        cb(null, parsed.query.phone);
      } catch (err) {
        console.error(err.message, {'socket.id': socket.id});
        cb('Oops!');
      }
    });

    socket.on('disconnect', () => close(socket.id));
  });
};
