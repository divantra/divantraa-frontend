# Payment logos

The checkout shows a small text label (e.g. "PhonePe") for each payment brand until you add the official logo.
Drop the files here — no code change needed. Use the brand's official kit (they have usage guidelines):

| File name (svg or png) | Brand |
|---|---|
| `upi` | UPI |
| `gpay`, `phonepe`, `paytm`, `bhim` | UPI apps |
| `hdfc`, `icici`, `sbi`, `axis`, `kotak`, `yes`, `pnb`, `bob` | Banks |
| `visa`, `mastercard`, `rupay`, `amex` | Card networks |
| `amazon`, `freecharge`, `mobikwik` | Wallets (`paytm` / `phonepe` reuse the app logos) |

Example: `public/payment-logos/phonepe.svg`. Height is fixed by the UI (about 20px), width follows the image.
