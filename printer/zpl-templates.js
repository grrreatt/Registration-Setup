// ZPL template generator for A6 portrait badges (203 dpi assumed)
// This keeps things simple and fast for Phase 2. Adjust positions as needed later.

(function(global){
  function sanitizeZplText(text){
    if(text == null) return '';
    const s = String(text);
    // ZPL doesn't like control chars, ^ or ~ inside data fields
    return s.replace(/[\^~\x00-\x1F]/g, ' ').replace(/\s+/g, ' ').trim();
  }

  function generateZplA6(data){
    const fullName = sanitizeZplText(data.full_name || '');
    const category = sanitizeZplText((data.category || '').toUpperCase());
    const institution = sanitizeZplText(data.institution || '');
    const badgeUid = sanitizeZplText(data.badge_uid || '');

    // 203dpi A6 portrait approx: width ~ 800 dots, height ~ 1180 dots
    return [
      '^XA',
      '^PW800',
      '^LH20,20',
      // Name
      '^CF0,80',
      `^FO30,30^FD${fullName}^FS`,
      // Category
      '^CF0,50',
      `^FO30,130^FD${category}^FS`,
      // Institution
      '^CF0,40',
      `^FO30,200^FD${institution}^FS`,
      // QR code (right side)
      '^FO520,260^BQN,2,6',
      `^FDLA,${badgeUid}^FS`,
      // Human-readable UID
      '^CF0,40',
      `^FO30,420^FDID: ${badgeUid}^FS`,
      '^XZ'
    ].join('\n');
  }

  global.ZplTemplates = { generateZplA6 };
})(window);


