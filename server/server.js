require("dotenv").config();
const path = require("path");
const express = require("express");
const app = express();

// middleware
app.use(express.json());
app.use(express.static("public"));

// mock database
const storeItems = new Map([
  [1, { priceInCents: 10 * 100, name: "Learn Stripe" }],
  [2, { priceInCents: 30 * 100, name: "Learn Express" }],
]);

const stripe = require("stripe")(process.env.STRIPE_PRIVATE_KEY);

// end-points
app.post("/checkout", async (req, res) => {
  try {
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      mode: "payment",
      line_items: req.body.items.map((item) => {
        const storeItem = storeItems.get(item.id);
        return {
          price_data: {
            currency: "usd",
            product_data: {
              name: storeItem.name,
            },
            unit_amount: storeItem.priceInCents,
          },
          quantity: item.quantity,
        };
      }),
      success_url: `${process.env.SERVER_URL}/success.html`,
      cancel_url: `${process.env.SERVER_URL}/failed.html`,
    });
    res.json({ url: session.url });
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
});

// 404 page
app.use((req, res) => {
  res
    .status(404)
    .sendFile(path.join(__dirname + "/public/page-not-found.html"));
});

app.listen(process.env.PORT, () => {
  console.log(`App is running on this on port ${process.env.PORT}`);
  console.log(`URL : http://localhost:${process.env.PORT}}`);
});
