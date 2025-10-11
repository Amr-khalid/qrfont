"use client";
import { useEffect, useState, useRef } from "react";
import { Html5Qrcode } from "html5-qrcode";
import axios from "axios";
import { motion } from "framer-motion";

interface StudentRecord {
  studentId: string;
  name: string;
  section: string;
  type: string;
  email: string;
  team: string;
  attendance: number;
  scannedAt: string;
  _id?: string;
  userId?: string;
  course?: string;
}

export default function ScanPage() {
  const [userId, setUser] = useState<string>("");
  const [record, setRecord] = useState<StudentRecord | null>(null);
  const [status, setStatus] = useState<string>("");
  const qrRegionId = "reader";
  const scanningRef = useRef(false);

  // ✅ تحميل userId مرة واحدة فقط
  useEffect(() => {
    const stored = localStorage.getItem("user");
    if (stored) {
      const parsed = JSON.parse(stored);
      const id = parsed?.data?.data?._id || "";
      setUser(id);
    }
  }, []);

  // ✅ بدء عملية المسح
  useEffect(() => {
    if (!userId) return;

    const html5QrCode = new Html5Qrcode(qrRegionId);

    Html5Qrcode.getCameras()
      .then((cameras) => {
        if (!cameras?.length) {
          setStatus("❌ لا توجد كاميرا متاحة");
          return;
        }

        const cameraId = cameras[0].id;

        html5QrCode.start(
          cameraId,
          { fps: 10, qrbox: { width: 250, height: 250 } },
          async (qrMessage) => {
            if (scanningRef.current) return;
            scanningRef.current = true;

            setStatus("📡 جاري قراءة الكود...");

            try {
              const response = await axios.post(
                "https://vqr-741l.vercel.app/api/scan/",
                { payload: qrMessage, deviceId: "web-camera-1" }
              );

              // 🔹 ربط السجل بالمستخدم
              await axios.post("https://vqr-741l.vercel.app/api/users/addToList", {
                userId,
                scanRecordId: response.data.record._id,
              });

              setRecord(response.data.record);
              setStatus("تم الحفظ");
              await html5QrCode.stop();
            } catch (error) {
              console.error("Error:", error);
              setStatus("❌ حدث خطأ أثناء الحفظ");
              scanningRef.current = false;
            }
          }
        );
      })
      .catch(() => setStatus("❌ لم يتم العثور على كاميرا"));

    return () => {
      html5QrCode.stop().catch(() => {});
    };
  }, [userId]);
  console.log(userId);
  if (!userId) {
    window.location.href = "/Login";
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="p-4 flex flex-col items-center justify-center min-h-screen  text-white"
    >
      <h2 className="text-xl font-bold mb-6">ماسح الأكواد QR</h2>

      {!record && (
        <div className="relative w-80 h-40 flex items-center justify-center">
          {/* منطقة المسح */}
          <div
            id={qrRegionId}
            className="absolute w-64 h-48 border-4 border-gray-900 rounded-xl shadow-violet-700/50  shadow-2xl"
          />

          {/* الخط الليزر المتحرك */}
          <motion.div
            initial={{ y: -100 }}
            animate={{ y: 100 }}
            transition={{
              repeat: Infinity,
              duration: 1.8,
              repeatType: "reverse",
              ease: "easeInOut",
            }}
            className="absolute w-66 h-[3px] bg-violet-600 shadow-[0_0_15px_rgba(255,0,0,0.8)]"
          />
        </div>
      )}

      {status && (
        <p className="mt-4 text-sm font-semibold bg-white/10 px-3 py-2 rounded-lg">
          {status}
        </p>
      )}

      {record && (
        <>
          <table className="mt-6 overflow-auto w-[100px] border border-white/30 shadow-black shadow-2xl text-sm   text-center">
            <thead className="bg-white/10 w-3 ">
              <tr className="w-3xs ">
                <th className=" border-white/20 p-2">Student ID</th>
                <th className=" border-white/20 p-2">Name</th>
                <th className=" border-white/20 p-2">Section</th>
                <th className=" border-white/20 p-2">Team</th>
                <th className=" border-white/20 p-2">Course</th>
                <th className=" border-white/20 p-2">Attendance</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td className="border border-white/10 p-2">
                  {record.studentId}
                </td>
                <td className="border border-white/10 p-2">{record.name}</td>
                <td className="border border-white/10 p-2">{record.section}</td>
                <td className="border border-white/10 p-2">{record.team}</td>
                <td className="border border-white/10 p-2">
                  {record.course}
                </td>{" "}
                <td className="border border-white/10 p-2">
                  {record.attendance}
                </td>
              </tr>
            </tbody>
          </table>

          <button
            className="mt-5  border-violet-600/10 shadow-violet-600  hover:translate-y-2  border-2 text-white px-5 py-2 rounded-full shadow-lg transition-all duration-300"
            onClick={() => location.reload()}
          >
            إعادة المسح
          </button>
        </>
      )}
    </motion.div>
  );
}
