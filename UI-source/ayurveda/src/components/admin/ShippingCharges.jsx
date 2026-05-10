import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { db } from "../../firebase";
import { motion } from "framer-motion";
import toast, { Toaster } from "react-hot-toast";
import "../../assets/Admin.css";

const REGIONS = {
  "South India": ["Kerala", "Tamil Nadu", "Karnataka", "Andhra Pradesh", "Telangana"],
  "North India": ["Delhi", "Uttar Pradesh", "Haryana", "Punjab", "Himachal Pradesh", "Uttarakhand", "Jammu & Kashmir", "Ladakh", "Chandigarh"],
  "East India": ["West Bengal", "Bihar", "Jharkhand", "Odisha", "Sikkim"],
  "West India": ["Maharashtra", "Gujarat", "Rajasthan", "Goa", "Dadra & Nagar Haveli", "Daman & Diu"],
  "Central India": ["Madhya Pradesh", "Chhattisgarh"],
  "North East India": ["Assam", "Meghalaya", "Manipur", "Mizoram", "Tripura", "Nagaland", "Arunachal Pradesh"]
};

const ALL_STATES = Object.values(REGIONS).flat();

const StatesCheckboxDropdown = ({ states, selected, onChange }) => {
  const [open, setOpen] = useState(false);
  const allSelected = states.length > 0 && states.every(s => selected.includes(s));

  const toggle = (state) => {
    onChange(selected.includes(state) ? selected.filter(s => s !== state) : [...selected, state]);
  };

  const toggleAll = () => {
    onChange(allSelected ? [] : [...states]);
  };

  return (
    <div style={{ position: 'relative' }}>
      <div
        onClick={() => setOpen(!open)}
        style={{ padding: '8px', border: '1px solid #ddd', borderRadius: '4px', fontSize: '0.85rem', cursor: 'pointer', background: 'white', minHeight: '36px' }}
      >
        {selected.length === 0 ? 'Select States' : `${selected.length} state(s) selected`}
      </div>
      {open && (
        <div style={{ position: 'absolute', top: '100%', left: 0, right: 0, background: 'white', border: '1px solid #ddd', borderRadius: '4px', maxHeight: '200px', overflowY: 'auto', zIndex: 10, boxShadow: '0 2px 8px rgba(0,0,0,0.15)' }}>
          <label style={{ display: 'flex', alignItems: 'center', padding: '6px 10px', cursor: 'pointer', borderBottom: '1px solid #eee', fontWeight: 'bold', fontSize: '0.8rem' }}>
            <input type="checkbox" checked={allSelected} onChange={toggleAll} style={{ marginRight: '8px' }} />
            Select All
          </label>
          {states.map(s => (
            <label key={s} style={{ display: 'flex', alignItems: 'center', padding: '6px 10px', cursor: 'pointer', fontSize: '0.8rem' }}>
              <input type="checkbox" checked={selected.includes(s)} onChange={() => toggle(s)} style={{ marginRight: '8px' }} />
              {s}
            </label>
          ))}
        </div>
      )}
    </div>
  );
};

export const ShippingCharges = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editingZone, setEditingZone] = useState(null);
  const [editingField, setEditingField] = useState(null);
  const [shippingData, setShippingData] = useState({
    free_shipping_threshold: "",
    default_charge: "",
    per_kg_charge: "",
    express_charge: "",
    cod_charge: "",
    zones: []
  });

  useEffect(() => {
    fetchShippingData();
  }, []);

  const fetchShippingData = async () => {
    try {
      const docRef = doc(db, "settings", "shipping");
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        setShippingData({ ...shippingData, ...docSnap.data() });
      }
    } catch (error) {
      console.error("Error fetching shipping data:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await setDoc(doc(db, "settings", "shipping"), shippingData);
      toast.success("Shipping charges saved successfully!");
    } catch (error) {
      toast.error("Error saving: " + error.message);
    } finally {
      setSaving(false);
    }
  };

  const addZone = () => {
    setShippingData({
      ...shippingData,
      zones: [...shippingData.zones, { name: "", states: "", charge: 0 }]
    });
  };

  const updateZone = (index, field, value) => {
    const updated = [...shippingData.zones];
    updated[index] = { ...updated[index], [field]: value };
    setShippingData({ ...shippingData, zones: updated });
  };

  const removeZone = (index) => {
    setShippingData({
      ...shippingData,
      zones: shippingData.zones.filter((_, i) => i !== index)
    });
  };

  if (loading) return <p style={{ textAlign: 'center', padding: '50px' }}>Loading...</p>;

  return (
    <motion.div
      className="admin-orders-page"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.6 }}
    >
      <Toaster position="top-center" />
      <div className="header-section">
        <motion.button
          className="back-btn"
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => navigate("/admin/dashboard")}
        >
          ⬅️ Back to Dashboard
        </motion.button>
        <h2>🚚 Shipping Charges</h2>
      </div>

      <motion.div
        className="add-product-form"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        style={{ maxWidth: '800px', margin: '0 auto' }}
      >
        {/* General Shipping Settings */}
        <div style={{ border: '1px solid #ddd', borderRadius: '8px', padding: '20px', marginBottom: '20px' }}>
          <h3 style={{ margin: '0 0 20px', color: '#333' }}>📦 General Settings</h3>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
            <div>
              <label style={{ display: 'block', fontWeight: 'bold', marginBottom: '5px', fontSize: '0.9rem' }}>Free Shipping Above (₹)</label>
              <input
                type="number"
                value={shippingData.free_shipping_threshold || ""}
                onChange={(e) => setShippingData({ ...shippingData, free_shipping_threshold: e.target.value === "" ? 0 : Number(e.target.value) })}
                placeholder="e.g., 500"
                style={{ width: '100%', padding: '10px', border: '1px solid #ddd', borderRadius: '5px' }}
              />
              <p style={{ margin: '4px 0 0', fontSize: '0.75rem', color: '#666' }}>Orders above this amount get free shipping. Set 0 to disable.</p>
            </div>
            <div>
              <label style={{ display: 'block', fontWeight: 'bold', marginBottom: '5px', fontSize: '0.9rem' }}>Default Shipping Charge (₹)</label>
              <input
                type="number"
                value={shippingData.default_charge || ""}
                onChange={(e) => setShippingData({ ...shippingData, default_charge: e.target.value === "" ? 0 : Number(e.target.value) })}
                placeholder="e.g., 50"
                style={{ width: '100%', padding: '10px', border: '1px solid #ddd', borderRadius: '5px' }}
              />
              <p style={{ margin: '4px 0 0', fontSize: '0.75rem', color: '#666' }}>Applied when no zone matches or below free threshold.</p>
            </div>
            <div>
              <label style={{ display: 'block', fontWeight: 'bold', marginBottom: '5px', fontSize: '0.9rem' }}>Per KG Extra Charge (₹)</label>
              <input
                type="number"
                value={shippingData.per_kg_charge || ""}
                onChange={(e) => setShippingData({ ...shippingData, per_kg_charge: e.target.value === "" ? 0 : Number(e.target.value) })}
                placeholder="e.g., 20"
                style={{ width: '100%', padding: '10px', border: '1px solid #ddd', borderRadius: '5px' }}
              />
              <p style={{ margin: '4px 0 0', fontSize: '0.75rem', color: '#666' }}>Additional charge per KG weight. Set 0 if not applicable.</p>
            </div>
            <div>
              <label style={{ display: 'block', fontWeight: 'bold', marginBottom: '5px', fontSize: '0.9rem' }}>Express Delivery Charge (₹)</label>
              <input
                type="number"
                value={shippingData.express_charge || ""}
                onChange={(e) => setShippingData({ ...shippingData, express_charge: e.target.value === "" ? 0 : Number(e.target.value) })}
                placeholder="e.g., 100"
                style={{ width: '100%', padding: '10px', border: '1px solid #ddd', borderRadius: '5px' }}
              />
              <p style={{ margin: '4px 0 0', fontSize: '0.75rem', color: '#666' }}>Extra charge for express/priority delivery.</p>
            </div>
            <div>
              <label style={{ display: 'block', fontWeight: 'bold', marginBottom: '5px', fontSize: '0.9rem' }}>COD Extra Charge (₹)</label>
              <input
                type="number"
                value={shippingData.cod_charge || ""}
                onChange={(e) => setShippingData({ ...shippingData, cod_charge: e.target.value === "" ? 0 : Number(e.target.value) })}
                placeholder="e.g., 30"
                style={{ width: '100%', padding: '10px', border: '1px solid #ddd', borderRadius: '5px' }}
              />
              <p style={{ margin: '4px 0 0', fontSize: '0.75rem', color: '#666' }}>Additional charge for Cash on Delivery orders.</p>
            </div>
          </div>
        </div>

        {/* Zone-based Shipping */}
        <div style={{ border: '1px solid #ddd', borderRadius: '8px', padding: '20px', marginBottom: '20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
            <h3 style={{ margin: 0, color: '#333' }}>📍 Zone-based Charges</h3>
            <button
              type="button"
              onClick={addZone}
              style={{ padding: '8px 16px', background: '#4CAF50', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer', fontWeight: 'bold', fontSize: '0.85rem' }}
            >
              + Add Zone
            </button>
          </div>
          <p style={{ fontSize: '0.8rem', color: '#666', margin: '0 0 15px' }}>
            Define shipping charges based on delivery zones/states. Zone charge overrides default charge.
          </p>

          {shippingData.zones.length === 0 ? (
            <p style={{ textAlign: 'center', color: '#999', padding: '20px' }}>No zones added. Default charge will apply to all orders.</p>
          ) : (
            shippingData.zones.map((zone, index) => (
              <div key={index} style={{ display: 'flex', gap: '10px', alignItems: 'flex-end', marginBottom: '12px', padding: '12px', background: '#f9f9f9', borderRadius: '6px' }}>
                <div style={{ flex: 1 }}>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 'bold', marginBottom: '4px' }}>Region</label>
                  <select
                    value={zone.name}
                    onChange={(e) => {
                      const region = e.target.value;
                      const updated = [...shippingData.zones];
                      updated[index] = { ...updated[index], name: region, states: (REGIONS[region] || []).join(", ") };
                      setShippingData({ ...shippingData, zones: updated });
                    }}
                    style={{ width: '100%', padding: '8px', border: '1px solid #ddd', borderRadius: '4px', fontSize: '0.85rem' }}
                  >
                    <option value="">Select Region</option>
                    {Object.keys(REGIONS).map(r => <option key={r} value={r}>{r}</option>)}
                  </select>
                </div>
                <div style={{ flex: 2, position: 'relative' }}>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 'bold', marginBottom: '4px' }}>States</label>
                  <StatesCheckboxDropdown
                    states={zone.name ? REGIONS[zone.name] || [] : ALL_STATES}
                    selected={zone.states ? zone.states.split(", ").filter(Boolean) : []}
                    onChange={(selected) => updateZone(index, "states", selected.join(", "))}
                  />
                </div>
                <div style={{ width: '100px' }}>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 'bold', marginBottom: '4px' }}>Charge (₹)</label>
                  <input
                    type="number"
                    value={zone.charge}
                    onChange={(e) => updateZone(index, "charge", Number(e.target.value))}
                    style={{ width: '100%', padding: '8px', border: '1px solid #ddd', borderRadius: '4px', fontSize: '0.85rem' }}
                  />
                </div>
                <button
                  type="button"
                  onClick={() => removeZone(index)}
                  style={{ padding: '8px 12px', background: '#f44336', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '0.9rem' }}
                >
                  ✕
                </button>
              </div>
            ))
          )}
        </div>

        <button
          onClick={handleSave}
          disabled={saving}
          style={{
            width: '100%',
            padding: '14px',
            background: saving ? '#ccc' : '#4CAF50',
            color: 'white',
            border: 'none',
            borderRadius: '8px',
            cursor: saving ? 'not-allowed' : 'pointer',
            fontWeight: 'bold',
            fontSize: '1rem'
          }}
        >
          {saving ? "Saving..." : "💾 Save Shipping Settings"}
        </button>

        {/* Display Uploaded Charges */}
        <div style={{ border: '1px solid #ddd', borderRadius: '8px', padding: '20px', marginTop: '20px' }}>
          <h3 style={{ margin: '0 0 15px', color: '#333' }}>📋 Current Shipping Charges</h3>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.9rem' }}>
            <thead>
              <tr style={{ background: '#f5f5f5' }}>
                <th style={{ padding: '10px', textAlign: 'left', borderBottom: '2px solid #ddd' }}>Charge Type</th>
                <th style={{ padding: '10px', textAlign: 'right', borderBottom: '2px solid #ddd' }}>Amount (₹)</th>
                <th style={{ padding: '10px', textAlign: 'center', borderBottom: '2px solid #ddd' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {[
                { key: 'free_shipping_threshold', label: 'Free Shipping Threshold' },
                { key: 'default_charge', label: 'Default Shipping Charge' },
                { key: 'per_kg_charge', label: 'Per KG Extra Charge' },
                { key: 'express_charge', label: 'Express Delivery Charge' },
                { key: 'cod_charge', label: 'COD Extra Charge' }
              ].map(({ key, label }) => (
                <tr key={key} style={{ borderBottom: '1px solid #eee' }}>
                  <td style={{ padding: '10px' }}>{label}</td>
                  <td style={{ padding: '10px', textAlign: 'right' }}>
                    {editingField === key ? (
                      <input
                        type="number"
                        value={shippingData[key]}
                        onChange={(e) => setShippingData({ ...shippingData, [key]: Number(e.target.value) })}
                        onBlur={() => { setEditingField(null); handleSave(); }}
                        autoFocus
                        style={{ width: '80px', padding: '4px', textAlign: 'right', border: '1px solid #4CAF50', borderRadius: '4px' }}
                      />
                    ) : (
                      `₹${shippingData[key]}`
                    )}
                  </td>
                  <td style={{ padding: '10px', textAlign: 'center' }}>
                    <button
                      onClick={() => setEditingField(key)}
                      style={{ padding: '4px 10px', background: '#2196F3', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', marginRight: '5px', fontSize: '0.8rem' }}
                    >✏️ Edit</button>
                    <button
                      onClick={() => { setShippingData({ ...shippingData, [key]: 0 }); handleSave(); }}
                      style={{ padding: '4px 10px', background: '#f44336', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '0.8rem' }}
                    >🗑️ Reset</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* Zone Charges Table */}
          {shippingData.zones.length > 0 && (
            <div style={{ marginTop: '20px' }}>
              <h4 style={{ margin: '0 0 10px', color: '#555' }}>📍 Zone Charges</h4>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.9rem' }}>
                <thead>
                  <tr style={{ background: '#f5f5f5' }}>
                    <th style={{ padding: '10px', textAlign: 'left', borderBottom: '2px solid #ddd' }}>Zone</th>
                    <th style={{ padding: '10px', textAlign: 'left', borderBottom: '2px solid #ddd' }}>States</th>
                    <th style={{ padding: '10px', textAlign: 'right', borderBottom: '2px solid #ddd' }}>Charge (₹)</th>
                    <th style={{ padding: '10px', textAlign: 'center', borderBottom: '2px solid #ddd' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {shippingData.zones.map((zone, index) => (
                    <tr key={index} style={{ borderBottom: '1px solid #eee' }}>
                      <td style={{ padding: '10px' }}>
                        {editingZone === index ? (
                          <input type="text" value={zone.name} onChange={(e) => updateZone(index, "name", e.target.value)} style={{ width: '100%', padding: '4px', border: '1px solid #4CAF50', borderRadius: '4px' }} />
                        ) : zone.name}
                      </td>
                      <td style={{ padding: '10px' }}>
                        {editingZone === index ? (
                          <input type="text" value={zone.states} onChange={(e) => updateZone(index, "states", e.target.value)} style={{ width: '100%', padding: '4px', border: '1px solid #4CAF50', borderRadius: '4px' }} />
                        ) : zone.states}
                      </td>
                      <td style={{ padding: '10px', textAlign: 'right' }}>
                        {editingZone === index ? (
                          <input type="number" value={zone.charge} onChange={(e) => updateZone(index, "charge", Number(e.target.value))} style={{ width: '80px', padding: '4px', textAlign: 'right', border: '1px solid #4CAF50', borderRadius: '4px' }} />
                        ) : `₹${zone.charge}`}
                      </td>
                      <td style={{ padding: '10px', textAlign: 'center' }}>
                        {editingZone === index ? (
                          <button onClick={() => { setEditingZone(null); handleSave(); }} style={{ padding: '4px 10px', background: '#4CAF50', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '0.8rem' }}>💾 Save</button>
                        ) : (
                          <button onClick={() => setEditingZone(index)} style={{ padding: '4px 10px', background: '#2196F3', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', marginRight: '5px', fontSize: '0.8rem' }}>✏️ Edit</button>
                        )}
                        <button onClick={() => { removeZone(index); setTimeout(handleSave, 100); }} style={{ padding: '4px 10px', background: '#f44336', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '0.8rem' }}>🗑️ Delete</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
};

export default ShippingCharges;
