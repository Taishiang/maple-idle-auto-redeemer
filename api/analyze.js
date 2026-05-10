export default async function handler(req, res) {

  if (req.method !== "POST") {
    return res.status(405).json({
      error: "Method not allowed"
    });
  }

  try {

    const { image } = req.body;

    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": Bearer ${process.env.OPENAI_API_KEY}
      },
      body: JSON.stringify({
        model: "gpt-4.1-mini",
        messages: [
          {
            role: "system",
            content:
              "你是楓之谷M掛機分析AI，只能回傳JSON。"
          },
          {
            role: "user",
            content: [
              {
                type: "text",
                text: `
請分析這張 Maple Idle 自動狩獵截圖。

規則：

1. 等級一定抓畫面中的 Lv.xxx
2. 左邊是起始EXP
3. 右邊是目前EXP
4. PLAYTIME 是掛機時間
5. 戰鬥狀況：
   - 如果畫面寫：
     每分鐘狩獵的怪物數量
     就回傳 monsterPerMinute

   - 如果畫面寫：
     每小時狩獵的怪物數量
     就回傳 monsterPerHour

   - 如果畫面寫：
     目前狩獵的怪物數量
     就回傳 totalMonster

6. 不要猜測不存在數字
7. 只回傳 JSON

格式：

{
  "level": 106,
  "startExp": 34.645,
  "endExp": 35.011,
  "playTime": "01:48:38",
  "monsterMode": "minute",
  "monsterValue": 106.4
}
`
              },
              {
                type: "image_url",
                image_url: {
                  url: image
                }
              }
            ]
          }
        ],
        temperature: 0
      })
    });

    const data = await response.json();

    let text = data.choices?.[0]?.message?.content || "{}";

    text = text.replace(/```json/g, "").replace(/```/g, "");

    return res.status(200).json(JSON.parse(text));

  } catch (err) {

    return res.status(500).json({
      error: err.message
    });

  }

}
