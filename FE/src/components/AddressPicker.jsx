import { useEffect, useMemo, useState } from 'react';

const fieldStyle = {
  width: '100%',
  padding: '12px 16px',
  border: '2px solid #e2e8f0',
  borderRadius: '10px',
  fontSize: '0.95rem',
  color: '#1e293b',
  background: '#fff',
  fontFamily: 'inherit',
};

function composeAddress(detail, provinceCode, wardCode, provincesData, wardsData) {
  const province = provincesData[provinceCode];
  const ward = wardsData[wardCode];
  const parts = [detail.trim(), ward?.name_with_type, province?.name_with_type].filter(Boolean);
  return parts.join(', ');
}

function AddressPicker({ value, onChange, label = 'Địa chỉ', savedAddress = '', required = false }) {
  const [provincesData, setProvincesData] = useState({});
  const [wardsData, setWardsData] = useState({});
  const [detail, setDetail] = useState('');
  const [provinceCode, setProvinceCode] = useState('');
  const [wardCode, setWardCode] = useState('');
  const [loadingAddressData, setLoadingAddressData] = useState(true);

  useEffect(() => {
    let mounted = true;

    Promise.all([
      fetch('/address/province.json').then((response) => response.json()),
      fetch('/address/ward.json').then((response) => response.json()),
    ])
      .then(([provinceJson, wardJson]) => {
        if (!mounted) return;
        setProvincesData(provinceJson);
        setWardsData(wardJson);
      })
      .finally(() => {
        if (mounted) setLoadingAddressData(false);
      });

    return () => {
      mounted = false;
    };
  }, []);

  const provinces = useMemo(() => (
    Object.values(provincesData).sort((a, b) => a.name_with_type.localeCompare(b.name_with_type, 'vi'))
  ), [provincesData]);

  const wardOptions = useMemo(() => (
    Object.values(wardsData)
      .filter((ward) => ward.parent_code === provinceCode)
      .sort((a, b) => a.name_with_type.localeCompare(b.name_with_type, 'vi'))
  ), [wardsData, provinceCode]);

  const preview = composeAddress(detail, provinceCode, wardCode, provincesData, wardsData);
  const displayAddress = preview || value || savedAddress;

  const updateAddress = (nextDetail, nextProvinceCode, nextWardCode) => {
    const isComplete = nextDetail.trim() && nextProvinceCode && nextWardCode;
    onChange(isComplete ? composeAddress(nextDetail, nextProvinceCode, nextWardCode, provincesData, wardsData) : '');
  };

  const handleDetailChange = (event) => {
    const nextDetail = event.target.value;
    setDetail(nextDetail);
    updateAddress(nextDetail, provinceCode, wardCode);
  };

  const handleProvinceChange = (event) => {
    const nextProvinceCode = event.target.value;
    setProvinceCode(nextProvinceCode);
    setWardCode('');
    updateAddress(detail, nextProvinceCode, '');
  };

  const handleWardChange = (event) => {
    const nextWardCode = event.target.value;
    setWardCode(nextWardCode);
    updateAddress(detail, provinceCode, nextWardCode);
  };

  return (
    <div className="address-picker">
      {label && (
        <label className="form-label" style={{ display: 'block', marginBottom: 8 }}>
          {label}{required && <span className="required-mark">*</span>}
        </label>
      )}

      {savedAddress && (
        <div style={{
          padding: '10px 12px',
          background: '#f8fafc',
          border: '1px solid #e2e8f0',
          borderRadius: 10,
          color: '#475569',
          fontSize: '0.9rem',
          marginBottom: 10,
        }}>
          Địa chỉ đã lưu: {savedAddress}
        </div>
      )}

      <div style={{ display: 'grid', gap: 10 }}>
        <input
          type="text"
          value={detail}
          onChange={handleDetailChange}
          placeholder="Số nhà, tên đường, tòa nhà..."
          style={fieldStyle}
        />

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
          <select value={provinceCode} onChange={handleProvinceChange} style={fieldStyle}>
            <option value="">{loadingAddressData ? 'Đang tải tỉnh/thành...' : 'Chọn tỉnh/thành phố'}</option>
            {provinces.map((province) => (
              <option key={province.code} value={province.code}>
                {province.name_with_type}
              </option>
            ))}
          </select>

          <select value={wardCode} onChange={handleWardChange} disabled={!provinceCode || loadingAddressData} style={fieldStyle}>
            <option value="">{provinceCode ? 'Chọn phường/xã' : 'Chọn tỉnh/thành trước'}</option>
            {wardOptions.map((ward) => (
              <option key={ward.code} value={ward.code}>
                {ward.name_with_type}
              </option>
            ))}
          </select>
        </div>
      </div>

      {displayAddress && (
        <div style={{
          marginTop: 10,
          padding: '10px 12px',
          background: '#ecfeff',
          border: '1px solid #bae6fd',
          borderRadius: 10,
          color: '#0c4a6e',
          fontSize: '0.9rem',
          lineHeight: 1.45,
        }}>
          <div><strong>Địa chỉ sử dụng:</strong> {displayAddress}</div>
          <a
            href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(displayAddress)}`}
            target="_blank"
            rel="noreferrer"
            style={{ color: '#0284c7', fontWeight: 600, display: 'inline-block', marginTop: 6 }}
          >
            Kiểm tra trên bản đồ
          </a>
        </div>
      )}
    </div>
  );
}

export default AddressPicker;
