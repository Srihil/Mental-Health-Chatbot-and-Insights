// src/lib/upload.js

import axios from "axios";

const upload = async (file) => {
  try {
    const formData = new FormData();
    formData.append("file", file);

    const res = await axios.post("/api/upload", formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });

    return res.data; // expects { url: "uploaded_file_url" }
  } catch (err) {
    console.error("Upload failed:", err);
    throw err;
  }
};

export default upload;
