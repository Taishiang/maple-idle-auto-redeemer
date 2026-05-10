export default async function handler(req, res) {

  try {

    if (req.method !== "POST") {
      return res.status(405).json({
        error: "Method not allowed"
      });
    }

    const { image } = req.body;

    if (!image) {
      return res.status(400).json({
        error: "No image"
      });
    }

    const response = await fetch(
      "https://api.openai.com/v1/chat/completions",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: Bearer ${process.env.OPENAI_API_KEY}
        },
        body: JSON.stringify({
          model: "gpt-4.1-mini",
          messages: [
            {
              role: "system",
              content:
                "你是楓之谷放置世界數值分析 AI。只回傳 JSON。"
            },
            {
              role: "user",
              content: [
                {
                  type: "text",
                  text:
`請分析這張楓之谷放置世界截圖。

只回傳 JSON：

{
  "level": 106,
  "startExp": 34.645,
  "endExp": 35.012,
  "playTime": "01:48:52",
  "monsterValue": 6391.4,
  "monsterMode": "hour"
}

規則：

1. level 只能是數字
2. startExp / endExp 只能是 %
3. playTime 必須 HH:MM:SS
4. monsterMode 只能：
minute
hour
total
5. 只回 JSON`
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
      }
    );

    const data = await response.json();

    const text =
      data.choices?.[0]?.message?.content || "";

    const clean = text
      .replace(/```json/g, "")
      .replace(/```/g, "")
      .trim();

    return res.status(200).json(JSON.parse(clean));

  } catch (err) {

    return res.status(500).json({
      error: err.message
    });
  }
}
