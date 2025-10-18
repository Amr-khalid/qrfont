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
        <path d="m7 8 4 4-4 4" /> {" "}
  </svg>
);

// Loadeer component
const Loader = () => (
  <div className="w-6 h-6 border-4 border-dashed rounded-full animate-spin border-violet-400"></div>
);

export default function ScanPage() {
  const [userId, setUser] = useState<string>("");
  const [record, setRecord] = useState<StudentRecord | null>(null);
  const [status, setStatus] = useState<string>("جاري تحميل الماسح الضوئي...");
  const [scriptLoaded, setScriptLoaded] = useState(false);
  const [geminiFeedback, setGeminiFeedback] = useState<string>("");
  const [isGenerating, setIsGenerating] = useState(false); // State for camera management

  const [cameras, setCameras] = useState<{ id: string; label: string }[]>([]);
  const [selectedCameraId, setSelectedCameraId] = useState<string | null>(null);

  const qrRegionId = "reader";
  const scanningRef = useRef(false);
  const html5QrCodeRef = useRef<any | null>(null); // Effect to dynamically load the html5-qrcode library script

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
  }, []); // 1. Get user ID from localStorage

  useEffect(() => {
    const stored = localStorage.getItem("user");
    if (stored) {
      const parsed = JSON.parse(stored);
      setUser(parsed?.data?.data?._id || "");
    } else {
      window.location.href = "/Login";
    }
  }, []); // 2. Discover available cameras once the script is loaded

  useEffect(() => {
    if (!scriptLoaded) return;

    const Html5Qrcode = window.Html5Qrcode;
    Html5Qrcode.getCameras()
      .then((devices: { id: string; label: string }[]) => {
        if (devices && devices.length) {
          setCameras(devices); // Prefer the back camera ('environment') first
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
  }, [scriptLoaded]); // 3. Start or restart the scanner when the selected camera changes

  useEffect(() => {
    if (!userId || !scriptLoaded || !selectedCameraId) return; // Stop any existing scanner before starting a new one

    if (html5QrCodeRef.current?.isScanning) {
      html5QrCodeRef.current.stop();
    }

    const Html5Qrcode = window.Html5Qrcode;
    // --- OPTIMIZATION: Added `rememberLastUsedCamera: true` for better UX on revisit ---
    const html5QrCode = new Html5Qrcode(qrRegionId, {
      rememberLastUsedCamera: true,
    });
    html5QrCodeRef.current = html5QrCode;

    // --- OPTIMIZATION: Increased FPS and adjusted qrbox for faster scanning ---
    const qrScannerConfig = {
      fps: 30, // Increased frames per second
      qrbox: { width: 280, height: 280 }, // Slightly larger scan box
      aspectRatio: 1.0, // Ensures the camera feed isn't stretched
    };

    const startScanner = async () => {
      setStatus("جاري تهيئة الكاميرا...");
      try {
        await html5QrCode.start(
          selectedCameraId,
          qrScannerConfig, // Using the new optimized config
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

  const handleGenerateFeedback = async () => {
    if (!record) return;

    setIsGenerating(true);
    setGeminiFeedback("");

    const systemPrompt = `You are a friendly and encouraging teacher's assistant in Egypt. Write a short, personalized feedback message in Arabic for a student based on their attendance record. The message should be positive and encouraging, even if attendance is low. Keep it under 30 words. If attendance is 5 or more, congratulate them. If it's less than 5, gently encourage them to attend more to not miss out on important topics.`;
    const userQuery = `Student Name: ${record.name}, Course: ${record.course}, Total Attendance Days: ${record.attendance}.`;
    const apiKey = "";
    const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-09-2025:generateContent?key=${apiKey}`;

    const payload = {
      contents: [{ parts: [{ text: userQuery }] }],
      systemInstruction: {
        parts: [{ text: systemPrompt }],
      },
    };

    try {
      const response = await fetch(apiUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        throw new Error(`API call failed with status: ${response.status}`);
      }

      const result = await response.json();
      const text = result.candidates?.[0]?.content?.parts?.[0]?.text;

      if (text) {
        setGeminiFeedback(text);
      } else {
        setGeminiFeedback("لم نتمكن من إنشاء الملاحظات. حاول مرة أخرى.");
      }
    } catch (error) {
      console.error("Error calling Gemini API:", error);
      setGeminiFeedback(
        "حدث خطأ أثناء الاتصال بالـ AI. يرجى التحقق من اتصالك بالإنترنت."
      );
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="p-4 flex flex-col items-center justify-center min-h-screen text-white"
    >
     <h2 className="text-xl font-bold mb-6">ماسح الأكواد QR</h2>     {" "}
      {!record && (
        // --- UI ADJUSTMENT: Enlarged container for better visual alignment with scan box ---
        <div className="relative w-80 h-60 flex items-center justify-center flex-col">
          <div
            id={qrRegionId}
            className="w-72 h-72 border-4 border-violet-500/20 rounded-xl shadow-violet-700/50 shadow-2xl overflow-hidden bg-gray-900/50"
          />
          <motion.div
            initial={{ y: -110 }}
            animate={{ y: 110 }}
            transition={{
              repeat: Infinity,
              duration: 1.1,
              repeatType: "reverse",
              ease: "easeInOut",
            }}
            // --- UI ADJUSTMENT: Widened the animated scan line ---
            className="absolute w-72 h-[3px] colorss shadow-[0_0_15px_rgba(139,92,246,0.8)]"
          />
        </div>
      )}
      
      {cameras.length > 1 && !record && (
        <button
          onClick={handleSwitchCamera}
          className="mt-4 flex items-center gap-2 bg-white/10 px-4 py-2 rounded-lg text-sm hover:bg-white/20 transition-colors"
        >
         <SwitchCameraIcon />          تبديل الكاميرا        {" "}
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
              <table className="w-full oveflow-x-auto border-collapse border border-white/30 shadow-black shadow-2xl text-sm text-center">
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
                     {" "}
                  </tr>
                 
                </tbody>
             
              </table>
              
            </div>
           
          </motion.div>
          <div className="mt-6 flex flex-col items-center gap-4 w-full max-w-md">
            {/* <button
              onClick={handleGenerateFeedback}
              disabled={isGenerating}
              className="flex items-center justify-center gap-2 bg-violet-600 hover:bg-violet-700 disabled:bg-violet-900 disabled:cursor-not-allowed text-white px-5 py-2 rounded-full shadow-lg transition-all duration-300 w-full"
            >
              {isGenerating ? <Loader /> : "✨ إنشاء ملاحظات بالطالب"}
            </button> */}

            {geminiFeedback && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="p-4 bg-white/10 rounded-lg text-center w-full"
              >
                <p className="text-violet-300 font-semibold">ملاحظات AI:</p>
                <p>{geminiFeedback}</p>
              </motion.div>
            )}
          </div>
                   {" "}
          <button
            className="mt-5 border-violet-600/10 shadow-violet-600 hover:-translate-y-1 border-2 text-white px-5 py-2 rounded-full shadow-lg transition-all duration-300"
            onClick={() => window.location.reload()}
          >
                        مسح كود آخر          {" "}
          </button>
                 {" "}
        </>
      )}
         {" "}
    </motion.div>
  );
}
