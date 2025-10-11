"use client";
import React, { useState } from "react";
import * as XLSX from "xlsx";
import axios from "axios";

export default function ExcelUploadPage() {
  const [data, setData] = useState<any[]>([]);
  const [message, setMessage] = useState("");
  const [uploading, setUploading] = useState(false);

  // 📂 عند اختيار ملف Excel
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (evt) => {
      const binaryStr = evt.target?.result;
      if (!binaryStr) return;

      const workbook = XLSX.read(binaryStr, { type: "binary" });
      const sheetName = workbook.SheetNames[0];
      const sheet = workbook.Sheets[sheetName];
      const jsonData = XLSX.utils.sheet_to_json(sheet);

      setData(jsonData);
      setMessage(jsonData.length > 0 ? "" : "⚠️ لا توجد بيانات في الملف.");
    };
    reader.readAsBinaryString(file);
  };

  // 🚀 إرسال كل صف إلى API
  const handleSendAll = async () => {
    if (data.length === 0) {
      setMessage("⚠️ لا توجد بيانات لإرسالها.");
      return;
    }

    setMessage(" جاري إرسال الأكواد...");
    setUploading(true);

    try {
      const userId =
        JSON.parse(localStorage.getItem("user") || "{}")?.data?.data?._id || "";

      for (const item of data) {
 
        const formatted = {
          studentId: item["Student ID"] || item.studentId,
          name: item["Name"] || item.name,
          email: item["Email"] || item.email,
          section: item["Section"] || item.section || "",
          type: "attendance",
          team: item["Team"] || item.team || "الفرقة الأولى",
          course: item["Course"] || item.course || "",
          userId,
        };

        const res = await axios.post(
          "https://vqr-741l.vercel.app/api/qr/generate",
          formatted
        );

        console.log("✅ تم إنشاء QR:", res.data);
      }

      setMessage("✅ تم إرسال جميع البيانات بنجاح!");
    } catch (err: any) {
      console.error("❌ خطأ أثناء الإرسال:", err.response?.data || err.message);
      setMessage(
        `⚠️ حدث خطأ أثناء الإرسال: ${
          err.response?.data?.message || err.message
        }`
      );
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="p-6 text-white flex flex-col items-center">
      <h1 className="text-2xl font-bold mb-4">📤 رفع وقراءة ملف Excel</h1>

      <input
        type="file"
        accept=".xlsx, .xls, .csv"
        onChange={handleFileChange}
        className=" border-2 cursor-pointer border-white/40 rounded-full shadow-2xl shadow-fuchsia-800 px-4 py-2  mb-4"
      />

      {data.length > 0 && (
        <>
          <table className="table-auto w-[250px]  text-sm text-white mb-6">
            <thead className="bg-gray-800/40">
              <tr>
                <th className=" p-1">Student ID</th>
                <th className=" p-1">Name</th>
                <th className=" p-1">Email</th>
                <th className=" p-1">Section</th>
                <th className=" p-1">Course</th>
              </tr>
            </thead>
            <tbody>
              {data.map((row, index) => (
                <tr key={index} className="hover:bg-blue-800/20 transition-all duration-200 hover:scale-[1.01] odd:bg-gray-900/90">
                  <td className=" p-2">
                    {row["Student ID"] || row.studentId}
                  </td>
                  <td className=" p-2">{row["Name"] || row.name}</td>
                  <td className=" p-2">{row["Email"] || row.email}</td>
                  <td className=" p-2">
                    {row["Section"] || row.section}
                  </td>
                  <td className=" p-2">{row["Course"] || row.course}</td>
                </tr>
              ))}
            </tbody>
          </table>

          <button
            onClick={handleSendAll}
            disabled={uploading}
            className="border-violet-600 border-2 hover:bg-violet-900/10 hover:translate-y-1.5 cursor-pointer text-white px-6 py-2 rounded-full shadow-md disabled:opacity-50 transition-all"
          >
            {uploading ? "⏳ جاري الإرسال..." : "Send To Email"}
          </button>
        </>
      )}

      {message && (
        <p className="mt-4 text-sm bg-black/40 p-2 rounded-lg">{message}</p>
      )}
    </div>
  );
}
