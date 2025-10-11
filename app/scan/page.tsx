"use client";
import { useEffect, useState, useRef } from "react";
// We will load the scanner library dynamically, so the import is removed.
// import { Html5Qrcode, Html5QrcodeError, Html5QrcodeResult } from "html5-qrcode";
import axios from "axios";
import { motion } from "framer-motion";

// By declaring the Html5Qrcode library in the global scope,
// we can use it with TypeScript once the script is loaded from the CDN.
declare global {
  interface Window {
    Html5Qrcode: any;
    Html5QrcodeError: any;
    Html5QrcodeResult: any;
  }
}

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
  const [status, setStatus] = useState<string>("جاري تحميل الماسح الضوئي...");
  const [scriptLoaded, setScriptLoaded] = useState(false);
  const qrRegionId = "reader";
  const scanningRef = useRef(false);
  const html5QrCodeRef = useRef<any | null>(null);

  // Effect to dynamically load the html5-qrcode library script from a CDN
  useEffect(() => {
    const script = document.createElement("script");
    script.src = "https://unpkg.com/html5-qrcode"; // CDN link for the library
    script.async = true;
    script.onload = () => setScriptLoaded(true);
    script.onerror = () =>
      setStatus("❌ فشل في تحميل الماسح الضوئي. يرجى تحديث الصفحة.");
    document.body.appendChild(script);

    return () => {
      // Clean up the script when the component unmounts
      document.body.removeChild(script);
    };
  }, []);

  // 1. Get user ID from localStorage or redirect
  useEffect(() => {
    const stored = localStorage.getItem("user");
    if (stored) {
      const parsed = JSON.parse(stored);
      const id = parsed?.data?.data?._id || "";
      setUser(id);
    } else {
      // If no user is found, redirect to the Login page
      window.location.href = "/Login";
    }
  }, []);

  // 2. Start the camera scanner ONLY when userId is available AND the script has loaded
  useEffect(() => {
    if (!userId || !scriptLoaded) return;

    setStatus("جاري تهيئة الكاميرا...");

    // The library is now available on the window object
    const Html5Qrcode = window.Html5Qrcode;
    const html5QrCode = new Html5Qrcode(qrRegionId);
    html5QrCodeRef.current = html5QrCode;

    const startScanner = async () => {
      try {
        const cameras = await Html5Qrcode.getCameras();
        if (cameras && cameras.length) {
          const cameraId = cameras[0].id;
          setStatus("يرجى توجيه الكاميرا إلى رمز QR");

          await html5QrCode.start(
            cameraId,
            {
              fps: 10,
              qrbox: { width: 250, height: 250 },
            },
            (decodedText: string, result: any) => {
              if (scanningRef.current) return;
              scanningRef.current = true;
              setStatus("📡 جارٍ التحقق من الكود...");
              handleScanSuccess(decodedText);
            },
            (errorMessage: string, error: any) => {
              // This callback is for when a QR code is not found, we can ignore it.
            }
          );
        } else {
          setStatus("❌ لم يتم العثور على أي كاميرا.");
        }
      } catch (err) {
        if (err instanceof Error) {
          if (err.name === "NotAllowedError") {
            setStatus(
              "🚫 تم رفض إذن الوصول إلى الكاميرا. يرجى السماح بالوصول في إعدادات المتصفح ثم تحديث الصفحة."
            );
          } else {
            setStatus(`❌ خطأ في تشغيل الكاميرا: ${err.message}`);
          }
        } else {
          setStatus("❌ حدث خطأ غير معروف أثناء تشغيل الكاميرا.");
        }
      }
    };

    startScanner();

    return () => {
      if (html5QrCodeRef.current?.isScanning) {
        html5QrCodeRef.current.stop().catch((err: any) => {
          console.error("فشل في إيقاف الماسح الضوئي.", err);
        });
      }
    };
  }, [userId, scriptLoaded]);

  const handleScanSuccess = async (qrMessage: string) => {
    try {
      const response = await axios.post(
        "https://vqr-741l.vercel.app/api/scan/",
        { payload: qrMessage, deviceId: "web-camera-1" }
      );

      await axios.post("https://vqr-741l.vercel.app/api/users/addToList", {
        userId,
        scanRecordId: response.data.record._id,
      });

      setRecord(response.data.record);
      setStatus("✅ تم تسجيل الحضور بنجاح!");
      if (html5QrCodeRef.current?.isScanning) {
        await html5QrCodeRef.current.stop();
      }
    } catch (error) {
      console.error("خطأ أثناء معالجة المسح:", error);
      setStatus("❌ حدث خطأ أثناء معالجة الكود.");
      setTimeout(() => {
        scanningRef.current = false;
        if (!record) setStatus("يرجى المحاولة مرة أخرى.");
      }, 2000);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="p-4 flex flex-col items-center justify-center min-h-screen text-white"
    >
      <h2 className="text-xl font-bold mb-6">ماسح الأكواد QR</h2>

      {!record && (
        <div className="relative w-80 h-80 flex items-center justify-center flex-col">
          <div
            id={qrRegionId}
            className="w-64 h-48 border-1 border-violet-500/50 rounded-xl shadow-violet-700/50 shadow-2xl overflow-hidden bg-gray-900/50"
          />
          <motion.div
            initial={{ y: -100 }}
            animate={{ y: 100 }}
            transition={{
              repeat: Infinity,
              duration: 1.8,
              repeatType: "reverse",
              ease: "easeInOut",
            }}
            className="absolute w-64 h-[3px] bg-violet-500 shadow-[0_0_15px_rgba(139,92,246,0.8)]"
          />
        </div>
      )}

      {status && (
        <p className="mt-4 text-center text-sm font-semibold bg-white/10 px-3 py-2 rounded-lg max-w-xs">
          {status}
        </p>
      )}

      {record && (
        <>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="w-full max-w-2xl mt-6"
          >
            <div className="overflow-x-auto">
              <table className="w-full border-collapse border border-white/30 shadow-black shadow-2xl text-sm text-center">
                <thead className="bg-white/10">
                  <tr>
                    <th className="border-b border-white/20 p-2">Student ID</th>
                    <th className="border-b border-white/20 p-2">Name</th>
                    <th className="border-b border-white/20 p-2">Section</th>
                    <th className="border-b border-white/20 p-2">Team</th>
                    <th className="border-b border-white/20 p-2">Course</th>
                    <th className="border-b border-white/20 p-2">Attendance</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td className="p-2">{record.studentId}</td>
                    <td className="p-2">{record.name}</td>
                    <td className="p-2">{record.section}</td>
                    <td className="p-2">{record.team}</td>
                    <td className="p-2">{record.course}</td>
                    <td className="p-2">{record.attendance}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </motion.div>

          <button
            className="mt-5 border-violet-600/10 shadow-violet-600 hover:-translate-y-1 border-2 text-white px-5 py-2 rounded-full shadow-lg transition-all duration-300"
            onClick={() => window.location.reload()}
          >
            مسح كود آخر
          </button>
        </>
      )}
    </motion.div>
  );
}
