/* =====================================================================
   LỚP ĐỒNG BỘ QUA SUPABASE (đăng nhập bằng Google)
   Cung cấp window.HSK_CLOUD cho index.html. Dữ liệu mỗi người nằm trong bảng
   public.user_docs (user_id, name, data). Quy tắc RLS chỉ cho mỗi người đọc/ghi dòng của chính mình.
   Giao diện db.doc(path).get()/.set() giống hệt lớp đồng bộ của bản trong Claude,
   nên thuật toán gộp tiến độ (theo thời điểm sửa của từng thẻ) giữ nguyên.
   ===================================================================== */
(function () {
  var cfg = window.HSK_CONFIG || {};
  var url = (cfg.supabaseUrl || "").trim().replace(/\/+$/, "").replace(/\/rest\/v1$/, "");
  var key = (cfg.supabaseKey || cfg.supabaseAnonKey || "").trim();
  if (!url || !key || !window.supabase || !window.supabase.createClient) {
    window.HSK_CLOUD = { enabled: false, reason: !url || !key ? "noconfig" : "nolib" };
    return;
  }
  var sb = window.supabase.createClient(url, key, {
    auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true, flowType: "pkce", storageKey: "hsk-moi-ngay-auth" }
  });
  var cache = null, cacheAt = 0, uid = null;

  function wrap(e) {
    var x = new Error((e && e.message) || "Lỗi kết nối");
    /* app chỉ thử lại khi code là "unavailable"; lỗi khác -> báo "Chưa đồng bộ được" và thử lại lần sau */
    x.code = !e || !e.code || /fetch|network|timeout/i.test(e.message || "") ? "unavailable" : "error";
    return x;
  }
  async function prefetch() {
    var r = await sb.from("user_docs").select("name,data").eq("user_id", uid);
    if (r.error) throw wrap(r.error);
    cache = new Map((r.data || []).map(function (row) { return [row.name, row.data]; }));
    cacheAt = Date.now();
  }
  var db = {
    doc: function (path) {
      var name = String(path).split("/").pop();
      return {
        get: async function () {
          if (!cache || Date.now() - cacheAt > 8000) await prefetch();
          var d = cache.get(name);
          return { exists: d !== undefined, data: function () { return d; } };
        },
        set: async function (obj) {
          var r = await sb.from("user_docs").upsert({ user_id: uid, name: name, data: obj, updated_at: new Date().toISOString() }, { onConflict: "user_id,name" });
          if (r.error) throw wrap(r.error);
          if (cache) cache.set(name, obj);
        }
      };
    }
  };

  window.HSK_CLOUD = {
    enabled: true,
    sb: sb,
    db: db,
    /* trả về {id,email,name,avatar} hoặc null */
    currentUser: async function () {
      var r = await sb.auth.getSession();
      var s = r && r.data && r.data.session;
      if (!s) return null;
      var u = s.user, m = u.user_metadata || {};
      uid = u.id; cache = null;
      return { id: u.id, email: u.email || "", name: m.full_name || m.name || "", avatar: m.avatar_url || m.picture || "" };
    },
    signIn: function () {
      return sb.auth.signInWithOAuth({ provider: "google", options: { redirectTo: location.origin + location.pathname, queryParams: { prompt: "select_account" } } });
    },
    signOut: async function () { uid = null; cache = null; try { await sb.auth.signOut({ scope: "local" }); } catch (e) {} },
    onChange: function (fn) { sb.auth.onAuthStateChange(function (ev) { fn(ev); }); }
  };
})();
