import { Geist } from "next/font/google"

const geist = Geist({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-geist",
})

export default function RootLayout({ children }) {
  return (
    <html lang="en" className={`${geist.variable} antialiased`}>
      <body>{children}</body>
    </html>
  )
}
