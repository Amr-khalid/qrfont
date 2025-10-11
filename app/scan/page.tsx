"use client";
import { useEffect, useState, useRef } from "react";
import axios from "axios";
import { motion } from "framer-motion";

// By declaring the Html5Qrcode library in the global scope,
// we can use it with TypeScript once the script is loaded from the CDN.
declare global {
  interface Window {
    Html5Qrcode: any;
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

// SVG Icon for the camera switch button
const SwitchCameraIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M11 19H4a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2h5" />
    <path d="M13 5h7a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2h-5" />
    <path d="m17 16-4-4 4-4" />
    <path d="m7 8 4 4-4 4" />
  </svg>
);

export default function ScanPage() {
  const [userId, setUser] = useState<string>("");
  const [record, setRecord] = useState<StudentRecord | null>(null);
  const [status, setStatus] = useState<string>("جاري تحميل الماسح الضوئي...");
  const [scriptLoaded, setScriptLoaded] = useState(false);

  // State for camera management
  const [cameras, setCameras] = useState<{ id: string; label: string }[]>([]);
  const [selectedCameraId, setSelectedCameraId] = useState<string | null>(null);

  const qrRegionId = "reader";
  const scanningRef = useRef(false);
  const html5QrCodeRef = useRef<any | null>(null);

  // Effect to dynamically load the html5-qrcode library script
  useEffect(() => {
    const script = document.createElement("script");
    script.src = "https://unpkg.com/html5-qrcode";
    script.async = true;
    script.onload = () => setScriptLoaded(true);
    script.onerror = () => setStatus("❌ فشل تحميل الماسح. يرجى تحديث الصفحة.");
    document.body.appendChild(script);

    return () => {
      document.body.removeChild(script);
    };
  }, []);

  // 1. Get user ID from localStorage
  useEffect(() => {
    const stored = localStorage.getItem("user");
    if (stored) {
      const parsed = JSON.parse(stored);
      setUser(parsed?.data?.data?._id || "");
    } else {
      window.location.href = "/Login";
    }
  }, []);

  // 2. Discover available cameras once the script is loaded
  useEffect(() => {
    if (!scriptLoaded) return;

    const Html5Qrcode = window.Html5Qrcode;
    Html5Qrcode.getCameras()
      .then((devices: { id: string; label: string }[]) => {
        if (devices && devices.length) {
          setCameras(devices);
          // Prefer the back camera ('environment') first
          const backCamera = devices.find(
            (device) =>
              device.label.toLowerCase().includes("back") ||
              device.label.toLowerCase().includes("rear")
          );
          if (backCamera) {
            setSelectedCameraId(backCamera.id);
          } else {
            // Otherwise, just use the first camera in the list
            setSelectedCameraId(devices[0].id);
          }
        }
      })
      .catch((err: any) => {
        console.error("Error fetching cameras:", err);
        setStatus("❌ لم نتمكن من الوصول للكاميرات.");
      });
  }, [scriptLoaded]);

  // 3. Start or restart the scanner when the selected camera changes
  useEffect(() => {
    if (!userId || !scriptLoaded || !selectedCameraId) return;

    // Stop any existing scanner before starting a new one
    if (html5QrCodeRef.current?.isScanning) {
      html5QrCodeRef.current.stop();
    }

    const Html5Qrcode = window.Html5Qrcode;
    const html5QrCode = new Html5Qrcode(qrRegionId);
    html5QrCodeRef.current = html5QrCode;

    const startScanner = async () => {
      setStatus("جاري تهيئة الكاميرا...");
      try {
        await html5QrCode.start(
          selectedCameraId,
          { fps: 10, qrbox: { width: 250, height: 250 } },
          (decodedText: string) => {
            if (scanningRef.current) return;
            scanningRef.current = true;
            setStatus("📡 جارٍ التحقق من الكود...");
            handleScanSuccess(decodedText);
          },
          () => {} // Ignore non-decode errors
        );
        setStatus("يرجى توجيه الكاميرا إلى رمز QR");
      } catch (err) {
        if (err instanceof Error) {
          if (err.name === "NotAllowedError") {
            setStatus(
              "🚫 تم رفض إذن الوصول. يرجى السماح به في إعدادات المتصفح."
            );
          } else {
            setStatus(`❌ خطأ في تشغيل الكاميرا: ${err.message}`);
          }
        }
      }
    };

    startScanner();

    return () => {
      if (html5QrCodeRef.current?.isScanning) {
        html5QrCodeRef.current.stop().catch((err: any) => {
          console.error("فشل في إيقاف الماسح.", err);
        });
      }
    };
  }, [userId, scriptLoaded, selectedCameraId]);

  const handleSwitchCamera = () => {
    if (cameras.length < 2) return;
    const currentIndex = cameras.findIndex(
      (cam) => cam.id === selectedCameraId
    );
    const nextIndex = (currentIndex + 1) % cameras.length;
    setSelectedCameraId(cameras[nextIndex].id);
  };

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
            className="w-64 h-48 border-4 border-violet-500/20 rounded-xl shadow-violet-700/50 shadow-2xl overflow-hidden bg-gray-900/50"
          />
          <motion.div
            initial={{ y: -100 }}
            animate={{ y: 90 }}
            transition={{
              repeat: Infinity,
              duration: 1.1,
              repeatType: "reverse",
              ease: "easeInOut",
            }}
            className="absolute w-64 h-[3px] bg-violet-500 shadow-[0_0_15px_rgba(139,92,246,0.8)]"
          />
        </div>
      )}

      {/* --- Camera Switch Button --- */}
      {cameras.length > 1 && !record && (
        <button
          onClick={handleSwitchCamera}
          className="mt-4 flex items-center gap-2 bg-white/10 px-4 py-2 rounded-lg text-sm hover:bg-white/20 transition-colors"
        >
          <SwitchCameraIcon />
          تبديل الكاميرا
        </button>
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
