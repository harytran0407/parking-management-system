import React from "react";
import { useNavigate } from "react-router-dom";
import {
  MapPin,
  Clock,
  Car,
  Bike,
  AlertTriangle,
  Info,
  CheckCircle2,
  XCircle,
  Calendar,
} from "lucide-react";

export default function UserDashboard() {
  const navigate = useNavigate();

  // Mock Data
  const buildingInfo = {
    buildingId: "B1",
    buildingName: "Smartpark Innovation Hub",
    address: "Saigon Hi-Tech Park, Thu Duc City, Ho Chi Minh City",
    mapUrl:
      "https://maps.google.com/maps?q=Saigon%20Hi-Tech%20Park,%20Ho%20Chi%20Minh&t=&z=15&ie=UTF8&iwloc=&output=embed",
    imageUrl:
      "https://i2-prod.leicestermercury.co.uk/article9542323.ece/ALTERNATES/s1200/0_GettyImages-1458811529.jpg",
    is24_7: false,
    weekdayHours: "06:00 - 22:00",
    weekendHours: "07:00 - 23:00",
    availableSlots: {
      car: 12,
      motorbike: 0,
    },
    rules: [
      "Maximum speed limit within the area is 5 km/h.",
      "Management is not responsible for property loss.",
      "Park strictly within the designated lines.",
    ],
  };

  const totalAvailable =
    buildingInfo.availableSlots.car + buildingInfo.availableSlots.motorbike;

  return (
    <div className="animate-slide-in w-full h-full space-y-0">
      <div className="flex items-center justify-between">
        {/* <h2 className="section-title">Parking Information</h2> */}
        {/* Badge trạng thái */}
        {/* <div className="bg-emerald-100 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 text-xs font-bold px-3 py-1 rounded-full border border-emerald-200 dark:border-emerald-800 flex items-center gap-1.5">
          <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></span>
          ACTIVE STATUS
        </div> */}
      </div>

      {/* Main card */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden shadow-sm flex flex-col lg:flex-row transition-all duration-300">
        <div className="w-full lg:w-2/5 relative min-h-[300px] lg:min-h-full">
          <img
            src={buildingInfo.imageUrl}
            alt={buildingInfo.buildingName}
            className="absolute inset-0 w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent"></div>
        </div>

        <div className="w-full lg:w-3/5 p-8 lg:p-10 flex flex-col">
          {/* Location and building info*/}
          <div className="mb-8">
            <h3 className="text-3xl font-bold text-slate-800 dark:text-white mb-3">
              {buildingInfo.buildingName}
            </h3>
            <div className="flex items-start gap-2 text-slate-500 dark:text-slate-400">
              <MapPin className="w-5 h-5 shrink-0 text-blue-500" />
              <p className="text-base">{buildingInfo.address}</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-stretch">
            <div className="flex flex-col space-y-6">
              {/* Working hours */}
              <div>
                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-2 flex items-center gap-2">
                  <Clock size={14} /> Working Hours
                </p>
                <div className="space-y-1 text-sm">
                  <div className="flex justify-between">
                    <span className="text-slate-500">Mon - Fri:</span>
                    <span className="font-semibold text-slate-700 dark:text-slate-200">
                      {buildingInfo.weekdayHours}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Weekend:</span>
                    <span className="font-semibold text-slate-700 dark:text-slate-200">
                      {buildingInfo.weekendHours}
                    </span>
                  </div>
                </div>
              </div>

              {/* Available slot */}
              <div>
                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-2 flex items-center gap-2">
                  <Info size={14} /> Availability
                </p>
                <div className="flex gap-3">
                  <div
                    className={`flex-1 p-2.5 rounded-xl border flex flex-col items-center justify-center ${buildingInfo.availableSlots.car > 0 ? "bg-emerald-50/50 dark:bg-emerald-950/10 border-emerald-100 dark:border-emerald-900/30" : "bg-red-50/50 dark:bg-red-950/10 border-red-100 dark:border-red-900/30"}`}
                  >
                    <Car
                      size={16}
                      className={
                        buildingInfo.availableSlots.car > 0
                          ? "text-emerald-500"
                          : "text-red-500"
                      }
                    />
                    <span
                      className={`text-base font-bold mt-0.5 ${buildingInfo.availableSlots.car > 0 ? "text-emerald-600 dark:text-emerald-400" : "text-red-600 dark:text-red-400"}`}
                    >
                      {buildingInfo.availableSlots.car > 0
                        ? buildingInfo.availableSlots.car
                        : "FULL"}
                    </span>
                    <span className="text-[9px] text-slate-400 uppercase">
                      Cars
                    </span>
                  </div>
                  <div
                    className={`flex-1 p-2.5 rounded-xl border flex flex-col items-center justify-center ${buildingInfo.availableSlots.motorbike > 0 ? "bg-emerald-50/50 dark:bg-emerald-950/10 border-emerald-100 dark:border-emerald-900/30" : "bg-red-50/50 dark:bg-red-950/10 border-red-100 dark:border-red-900/30"}`}
                  >
                    <Bike
                      size={16}
                      className={
                        buildingInfo.availableSlots.motorbike > 0
                          ? "text-emerald-500"
                          : "text-red-500"
                      }
                    />
                    <span
                      className={`text-base font-bold mt-0.5 ${buildingInfo.availableSlots.motorbike > 0 ? "text-emerald-600 dark:text-emerald-400" : "text-red-600 dark:text-red-400"}`}
                    >
                      {buildingInfo.availableSlots.motorbike > 0
                        ? buildingInfo.availableSlots.motorbike
                        : "FULL"}
                    </span>
                    <span className="text-[9px] text-slate-400 uppercase">
                      Bikes
                    </span>
                  </div>
                </div>
              </div>

              {/* Connect with google map */}
              <div className="h-44 w-full bg-slate-100 dark:bg-slate-800 rounded-xl overflow-hidden border border-slate-200 dark:border-slate-800 shadow-inner flex-grow min-h-[170px]">
                <iframe
                  src={buildingInfo.mapUrl}
                  width="100%"
                  height="100%"
                  style={{ border: 0 }}
                  allowFullScreen=""
                  loading="lazy"
                  referrerPolicy="no-referrer-when-downgrade"
                ></iframe>
              </div>
            </div>

            <div className="flex flex-col justify-between h-full">
              {/* Parking car rule*/}
              <div>
                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3 flex items-center gap-2">
                  <AlertTriangle size={14} className="text-amber-500" />{" "}
                  Regulations
                </p>
                <ul className="space-y-3">
                  {buildingInfo.rules.map((rule, idx) => (
                    <li
                      key={idx}
                      className="text-sm text-slate-600 dark:text-slate-400 flex items-start gap-2"
                    >
                      <span className="w-1.5 h-1.5 bg-blue-500 rounded-full mt-1.5 shrink-0"></span>
                      <p className="leading-normal">{rule}</p>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Bookslot button */}
              {totalAvailable > 0 && (
                <div className="mt-6 md:mt-0">
                  <button
                    onClick={() => navigate("/user/book")}
                    className="group w-full flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-6 py-4 rounded-xl font-bold shadow-lg shadow-blue-500/25 transition-all active:scale-95 h-[52px] animate-wobble-slow hover:animate-none"
                  >
                    <Calendar
                      size={20}
                      className="group-hover:rotate-12 transition-transform"
                    />
                    BOOK A SLOT NOW
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
