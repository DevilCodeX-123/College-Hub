# How to Get Your MongoDB Atlas Connection String

Since you are new to MongoDB, follow these exact steps to get your connection string:

1.  **Create an Account**
    *   Go to [https://www.mongodb.com/cloud/atlas/register](https://www.mongodb.com/cloud/atlas/register) and sign up (it's free).

2.  **Create a Cluster**
    *   After logging in, click **"Build a Database"**.
    *   Select **"M0 Sandbox"** (Free Tier).
    *   Select a provider (AWS) and region (closest to India, e.g., Mumbai).
    *   Click **"Create"**.

3.  **Create a Database User**
    *   You will be asked to create a "Database User".
    *   **Username**: `admin` (or whatever you want)
    *   **Password**: Choose a simple password (e.g., `password123`) and **Remember it**.
    *   Click **"Create User"**.

4.  **Allow Network Access**
    *   Scroll down to "Network Access".
    *   Click **"Add My Current IP Address"** OR allow access from anywhere (0.0.0.0/0) if you want to be sure it works easily.
    *   Click **"Finish and Close"**.

5.  **Get the Connection String**
    *   On your Dashboard, click the **"Connect"** button on your cluster.
    *   Select **"Drivers"** (Node.js).
    *   **Copy the string** that looks like this:
        `mongodb+srv://admin:<password>@cluster0.abcde.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`
    *   **IMPORTANT**: Replace `<password>` with the password you created in Step 3.

**Once you have this string, please paste it here!**
