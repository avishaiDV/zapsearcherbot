const { Telegraf } = require("telegraf");
require("dotenv").config();
const fetch = require("node-fetch");
const jsdom = require("jsdom");
const { JSDOM } = jsdom;

const token = String(process?.env?.BOT_TOKEN);

const bot = new Telegraf(token)

bot.command('start', ctx => {
    bot.telegram.sendMessage(ctx.chat.id, `
    שלום ${ctx?.from?.first_name}! \n
    ברוך/ה הבא/ה לבוט החיפוש בזאפ, בשביל לחפש מוצר כל מה שאת/ה צריך/ה לעשות זה לשלוח לי \n
    "/search מוצר"\n
    לאחר מכן אשלח לך כפתור שלאחר לחיצה בו תראה/י את כל התוצאות! \n
    נתקלת בבעיה? צריך עזרה? מוזמן לשלוח לי הודעה: @avishaii
    `, {
        parse_mode: "Markdown"
    })
})

bot.command("search", (ctx) => {
    let text = ctx?.message?.text?.split(" ");
    text?.splice(0, 1);
    if (text.length) {
        text = text.join(" ");
    }

    ctx.reply(`לתוצאות חיפוש עבור *${text}*, לחץ על הכפתור למטה!`, {
        reply_markup: {
            inline_keyboard: [
                [{
                    text: "לחץ כאן!", switch_inline_query_current_chat: String(text)
                }]
            ]
        },
        parse_mode: "Markdown"
    },
    )
})

bot.on("inline_query", async ctx => {
    const query = ctx?.inlineQuery?.query;
    if (!query) return;
    try {
        const req = await fetch("https://www.zap.co.il/search.aspx?keyword=" + query);
        const res = await req?.text();
        const dom = new JSDOM(res);
        const document = dom?.window?.document;
        let arr = Array.from(document.querySelectorAll("[data-model-id]")).map(p => {
            return {
                link: p?.children[1]?.children[0]?.children[0]?.getAttribute("href"),
                name: p?.children[1]?.children[0]?.children[0]?.getAttribute("aria-label"),
                image: p?.children[0]?.children[1]?.children[0]?.getAttribute("src")
            }
        }).filter(({link}) => link?.includes("model.aspx") == true);

        ctx.answerInlineQuery(arr.map((item, index) => {
            const { link, name, image } = item;
            return {
                type: "article",
                id: String(index),
                title: name,
                input_message_content: {
                    message_text: `${name} \n https://zap.co.il${link}`
                },
                thumb_url: image
            }

        }))

    } catch (error) {
        console.error(error)
    }
});

bot.launch().then(() => {
    console.log("bot is up!");
});