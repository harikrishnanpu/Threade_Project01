# THREADË – Full-Stack E-Commerce Web Application

A complete production-ready **e-commerce platform** for fashion retail built with the MERN stack and real-time features. This application includes powerful **admin and user panels**, **variant-based product handling**, secure **checkout**, **coupon engine**, **referral system**, **wallet integration**, and **live chat/order updates** using **Socket.IO**.

---

## 🔗 Demo

> https://threade.harikrishnan.live

---

## ⚙️ Features

### 👤 User Panel
- User registration & login
- Google OAuth login
- Browse products with size/color variants
- Search, filter, sort (category, brand, sub-category, price, rating)
- Wishlist management
- Cart management
- Coupon & offer integration
- Referral code application
- Razorpay payment gateway
- Wallet top-up and payment
- Cancel/Return individual items
- Real-time order status updates
- Live chat support with admin

### 🛠️ Admin Panel
- Login with protected dashboard
- Product management (variants included)
- Category / Sub-category / Brand CRUD
- Offer & coupon management
- Order management with filters, sorting, export, and bulk actions
- Wallet and referral tracking
- View and reply to user chats
- Real-time updates on new orders and actions

### 💬 Real-Time (Socket.IO)
- User ↔ Admin live chat with room tracking
- Live order status updates for both user and admin
- Admin alerts on new orders, return requests, cancellations

---

## 🧰 Tech Stack

| Layer        | Tech Used                            |
|--------------|--------------------------------------|
| Frontend     | EJS, HTML5, CSS3, JavaScript         |
| Backend      | Node.js, Express.js                  |
| Database     | MongoDB, Mongoose                    |
| Auth         | JWT, Google OAuth 2.0                |
| Payment      | Razorpay                             |
| Realtime     | Socket.IO                            |
| Deployment   | AWS EC2, PM2, Nginx                  |

---

## 📂 Project Structure (Simplified)

/ecommerce-app
├── controllers/
├── models/
├── routes/
├── services/
├── views/
│ ├── users/
│ └── admin/
├── public/
├── socket/
├── utils/
├── middleware/
├── config/
├── .env
├── server.js
└── README.md


--

## 🚀 Getting Started

### 1. Clone the Repository

```bash
git clone https://github.com/yourusername/fashionverse-ecommerce.git
cd  threade_project001

npm install

Create a .env file in the root:
PORT=3000
MONGO_URI=your_mongo_connection_string
JWT_SECRET=your_jwt_secret
RAZORPAY_KEY_ID=your_razorpay_key
RAZORPAY_KEY_SECRET=your_razorpay_secret
GOOGLE_CLIENT_ID=your_google_oauth_client_id
GOOGLE_CLIENT_SECRET=your_google_oauth_secret
NODEMAILER_EMAIL
NODEMAILER_PASS


npm start



```

Highlights:


Clean and responsive UI

Modular controller/service structure

Real-time features with Socket.IO

Fully functional admin and user portals

Scalable MongoDB data design

JWT authentication and Google OAuth

Smart coupon and offer application logic




