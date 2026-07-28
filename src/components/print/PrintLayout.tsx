import React, { useEffect, useState } from "react";
import { createPortal } from "react-dom";

interface PrintLayoutProps {
  id: string;
  title: string;
  metadata: { label: string; value: string | React.ReactNode }[];
  providerInfo?: {
    name: string;
    address: string;
    cityCountry: string;
    email: string;
    website: string;
    phone: string;
    registration?: string;
  };
  clientInfo?: {
    title: string;
    fields: { label: string; value: string | React.ReactNode }[];
  };
  summaryCards?: { label: string; value: string | React.ReactNode }[];
  children: React.ReactNode;
  logoUrl?: string;
}

export const PrintLayout: React.FC<PrintLayoutProps> = ({
  id,
  title,
  metadata,
  providerInfo = {
    name: "OPTIVITA",
    address: "123 Health Street",
    cityCountry: "Kuwait City, Kuwait",
    email: "optivita.support@gmail.com",
    website: "www.optivita.netlify.app",
    phone: "+965 12345678",
  },
  clientInfo,
  summaryCards,
  children,
  logoUrl = "/optivita-logo.png",
}) => {
  const [portalContainer, setPortalContainer] = useState<HTMLElement | null>(null);

  useEffect(() => {
    let container = document.getElementById("print-root");
    if (!container) {
      container = document.createElement("div");
      container.id = "print-root";
      document.body.appendChild(container);
    }
    setPortalContainer(container);
  }, []);

  const renderLayoutBody = (isPrint: boolean) => (
    <div
      className={`relative z-10 ${isPrint ? "space-y-6" : "flex flex-col justify-between h-full space-y-4"}`}
    >
      {/* --- 1. TOP HEADER SECTION --- */}
      <div className="flex justify-between items-start">
        {/* Left Brand details */}
        <div className="space-y-1 text-left">
          <div className="flex items-center gap-2">
            <div className="h-10 w-10 flex items-center justify-center bg-white rounded-xl overflow-hidden shrink-0">
              <img src={logoUrl} alt="Optivita Logo" className="h-full w-full object-contain" />
            </div>
            <div>
              <h1 className="font-extrabold text-2xl tracking-wider text-[#0D4E8A] leading-none uppercase">
                {providerInfo.name}
              </h1>
              <p className="text-[8px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">
                YOUR PRECISION HEALTH PARTNER
              </p>
            </div>
          </div>
          <p className="text-[9px] text-[#13B5B1] font-semibold tracking-wider uppercase mt-1">
            Precision Nutrition • Sustainable Results • Lifelong Wellness
          </p>
          <p className="text-[9px] text-slate-500 font-medium leading-none">
            International Online Clinical Nutrition & Wellness Services
          </p>
        </div>

        {/* Right Header Metadata */}
        <div className="text-right space-y-1">
          <h2 className="text-2xl font-black tracking-tight text-[#0D4E8A]">{title}</h2>
          <div className="text-[10px] space-y-0.5 text-slate-650">
            {metadata.map((item, idx) => (
              <p key={idx}>
                <span className="font-semibold text-slate-400">{item.label}:</span>{" "}
                <span className="font-bold text-slate-900">{item.value}</span>
              </p>
            ))}
          </div>
        </div>
      </div>

      {/* Divider */}
      <div className="border-b border-slate-200" />

      {/* --- 2. DOUBLE-COLUMN CARDS: PROVIDER vs CLIENT/EMPLOYEE --- */}
      <div className="grid grid-cols-2 gap-4 text-left">
        {/* Provider Card */}
        <div className="p-3.5 rounded-2xl bg-[#F8FBFD] border border-slate-100/80 space-y-1">
          <h3 className="text-[10px] font-bold text-[#0D4E8A] tracking-wider uppercase">
            Provider Information
          </h3>
          <div className="text-[10px] space-y-0.5 text-slate-650 leading-relaxed">
            <p className="font-bold text-slate-900">{providerInfo.name}</p>
            <p className="text-slate-500">{providerInfo.address}</p>
            <p className="text-slate-500">{providerInfo.cityCountry}</p>
            {providerInfo.registration && (
              <p className="font-bold text-[#0D4E8A]">Reg No: {providerInfo.registration}</p>
            )}
            <div className="pt-1 text-[9px] space-y-0.5">
              <p>
                <span className="font-medium text-slate-400">Email:</span> {providerInfo.email}
              </p>
              <p>
                <span className="font-medium text-slate-400">Website:</span> {providerInfo.website}
              </p>
              <p>
                <span className="font-medium text-slate-400">Phone:</span> {providerInfo.phone}
              </p>
            </div>
          </div>
        </div>

        {/* Client/Employee Card */}
        {clientInfo && (
          <div className="p-3.5 rounded-2xl bg-[#F8FBFD] border border-slate-100/80 space-y-1">
            <h3 className="text-[10px] font-bold text-[#0D4E8A] tracking-wider uppercase">
              {clientInfo.title}
            </h3>
            <div className="text-[10px] space-y-0.5 text-slate-650 leading-relaxed">
              {clientInfo.fields.map((f, idx) => (
                <p key={idx}>
                  <span className="font-semibold text-slate-450">{f.label}:</span>{" "}
                  <span className="font-bold text-slate-900">{f.value}</span>
                </p>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* --- 3. SUMMARY KPI CARDS --- */}
      {summaryCards && summaryCards.length > 0 && (
        <div
          className={`grid gap-3`}
          style={{ gridTemplateColumns: `repeat(${summaryCards.length}, minmax(0, 1fr))` }}
        >
          {summaryCards.map((card, idx) => (
            <div
              key={idx}
              className="p-2.5 rounded-xl bg-white border border-slate-100 text-center shadow-xs"
            >
              <span className="text-[8px] font-bold text-slate-400 uppercase tracking-wider block">
                {card.label}
              </span>
              <span className="text-xs font-bold text-slate-800 mt-0.5 block truncate">
                {card.value}
              </span>
            </div>
          ))}
        </div>
      )}

      {/* --- 4. MAIN CONTENT CHILDREN --- */}
      <div className={isPrint ? "block space-y-4" : "flex-1 min-h-0 space-y-4"}>{children}</div>

      {/* --- 5. SYSTEM FOOTER --- */}
      <div className="space-y-3 pt-3 shrink-0 border-t border-slate-200">
        <div className="grid grid-cols-2 gap-4 text-[9px] text-slate-500 leading-normal text-left">
          {/* Left Column: Branding logo and tagline */}
          <div className="flex items-start gap-2.5">
            <img src={logoUrl} alt="Optivita Logo" className="h-9 w-9 object-contain" />
            <div>
              <p className="font-bold text-[#0D4E8A] text-[9px]">{providerInfo.name}</p>
              <p className="italic text-[8px] leading-tight">Your Precision Health Partner</p>
              <p className="text-[7.5px] text-[#13B5B1] font-semibold leading-tight mt-0.5">
                Precision Nutrition • Sustainable Results • Lifelong Wellness
              </p>
            </div>
          </div>
          {/* Right Column: Dynamic Support details */}
          <div className="text-right space-y-0.5">
            <p className="font-bold text-slate-800 text-[9px]">Customer Support</p>
            <p className="text-slate-650">Email: {providerInfo.email}</p>
            <p className="text-slate-650">Website: {providerInfo.website}</p>
            <p className="text-[7.5px] text-slate-400 italic">
              Generated electronically by OPTIVITA
            </p>
          </div>
        </div>

        <div className="text-center text-[7.5px] text-slate-400 tracking-wider pt-2 border-t border-slate-100/60">
          © {new Date().getFullYear()} {providerInfo.name.toUpperCase()} | YOUR PRECISION HEALTH
          PARTNER | CLINICAL EXCELLENCE
        </div>
      </div>
    </div>
  );

  return (
    <>
      {/* 1. SCREEN VIEW PREVIEW (Inside #root, styled with nice preview card styling) */}
      <div
        className="w-[210mm] min-h-[297mm] bg-white text-slate-800 p-[15mm] font-sans relative border border-slate-200 dark:border-slate-800 shadow-xl overflow-hidden select-none no-print rounded-2xl flex flex-col justify-between"
        style={{
          color: "#1F2937",
          background: "#FFFFFF",
          fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
          boxSizing: "border-box",
        }}
      >
        {/* Subtle watermark background */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-[0.05] z-0">
          <img
            src={logoUrl}
            alt="Optivita Watermark"
            className="w-[450px] h-[450px] object-contain"
          />
        </div>
        {renderLayoutBody(false)}
      </div>

      {/* 2. DEDICATED PRINT CONTAINER (Rendered via React Portal at document.body level) */}
      {portalContainer &&
        createPortal(
          <div
            id={id}
            className="w-full bg-white text-slate-800 font-sans relative block"
            style={{
              color: "#1F2937",
              background: "#FFFFFF",
              fontFamily:
                "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
              boxSizing: "border-box",
              width: "100%",
              height: "auto",
              minHeight: "100%",
            }}
          >
            {/* Print specific stylesheet rules */}
            <style
              dangerouslySetInnerHTML={{
                __html: `
            /* Hide print container by default on screen */
            #print-root {
              display: none;
            }
            @media print {
              /* 1. Completely hide the main application container and any dialog portals */
              body * {
                visibility: hidden !important;
              }
              
              /* 2. Expose only the print root portal container and its children */
              #print-root, #print-root * {
                visibility: visible !important;
              }
              
              #print-root {
                display: block !important;
                position: absolute !important;
                left: 0 !important;
                top: 0 !important;
                width: 100% !important;
                height: auto !important;
                background: white !important;
                margin: 0 !important;
                padding: 0 !important;
                z-index: 99999999 !important;
              }
              
              html, body {
                background: white !important;
                background-color: white !important;
                margin: 0 !important;
                padding: 0 !important;
              }
              
              /* Redundant safety overrides for overlays, backdrop and layout components */
              #root, [data-radix-portal], .modal, .overlay, .dialog, .backdrop, .sidebar, .header, .navigation, .app-layout {
                display: none !important;
                visibility: hidden !important;
                height: 0 !important;
                width: 0 !important;
                overflow: hidden !important;
                opacity: 0 !important;
              }
              
              @page {
                size: A4 portrait;
                margin: 10mm;
              }
            }
          `,
              }}
            />

            {/* Subtle watermark background */}
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-[0.05] z-0">
              <img
                src={logoUrl}
                alt="Optivita Watermark"
                className="w-[450px] h-[450px] object-contain"
              />
            </div>
            {renderLayoutBody(true)}
          </div>,
          portalContainer,
        )}
    </>
  );
};
