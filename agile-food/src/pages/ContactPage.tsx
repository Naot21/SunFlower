export default function ContactPage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8">Liên hệ</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
        <div>
          <h2 className="text-2xl font-semibold mb-4">Thông tin liên hệ</h2>

          <div className="mb-6">
            <h3 className="font-semibold mb-2">Địa chỉ</h3>
            <p className="text-gray-600">
                156 Trương Vĩnh Nguyên, Phường Thường Thạnh, Quận Cái Răng, TP. Cần Thơ
            </p>
          </div>

          <div className="mb-6">
            <h3 className="font-semibold mb-2">Điện thoại</h3>
            <p className="text-gray-600">
              +84 364131824
            </p>
          </div>

          <div className="mb-6">
            <h3 className="font-semibold mb-2">Email</h3>
            <p className="text-gray-600">
              Dtan@agilefood.vn
            </p>
          </div>

          <div className="mb-6">
            <h3 className="font-semibold mb-2">Giờ làm việc</h3>
            <p className="text-gray-600">
              Thứ 2 - Thứ 6: 8:00 - 20:00<br />
              Thứ 7 - Chủ nhật: 8:00 - 22:00
            </p>
          </div>

          <div>
            <h3 className="font-semibold mb-2">Kết nối với chúng tôi</h3>
            <div className="flex space-x-4">
              <a href="https://facebook.com" className="text-gray-700 hover:text-black">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M22 12c0-5.523-4.477-10-10-10S2 6.477 2 12c0 4.991 3.657 9.128 8.438 9.878v-6.987h-2.54V12h2.54V9.797c0-2.506 1.492-3.89 3.777-3.89 1.093 0 2.238.195 2.238.195v2.46h-1.26c-1.243 0-1.63.771-1.63 1.562V12h2.773l-.443 2.89h-2.33v6.988C18.343 21.128 22 16.991 22 12z" />
                </svg>
              </a>
              <a href="https://youtube.com" className="text-gray-700 hover:text-black">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm5.01 14.99c-1.64 1.64-3.81 2.54-6.01 2.54s-4.37-.9-6.01-2.54C3.35 15.36 2.45 13.19 2.45 11c0-2.19.9-4.36 2.54-6.01C6.63 3.35 8.8 2.45 11 2.45s4.37.9 6.01 2.54c1.64 1.65 2.54 3.82 2.54 6.01 0 2.19-.9 4.36-2.54 6.01zM8.5 8.5l7 3.5-7 3.5v-7z" />
                </svg>
              </a>
              <a href="https://instagram.com" className="text-gray-700 hover:text-black">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z" />
                </svg>
              </a>
            </div>
          </div>
        </div>

        <div>
          <h2 className="text-2xl font-semibold mb-4">Gửi tin nhắn cho chúng tôi</h2>
          <form className="space-y-4">
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
                Họ và tên
              </label>
              <input
                type="text"
                id="name"
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-black"
                placeholder="Nhập họ và tên của bạn"
              />
            </div>

            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                Email
              </label>
              <input
                type="email"
                id="email"
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-black"
                placeholder="Nhập email của bạn"
              />
            </div>

            <div>
              <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-1">
                Số điện thoại
              </label>
              <input
                type="tel"
                id="phone"
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-black"
                placeholder="Nhập số điện thoại của bạn"
              />
            </div>

            <div>
              <label htmlFor="message" className="block text-sm font-medium text-gray-700 mb-1">
                Tin nhắn
              </label>
              <textarea
                id="message"
                rows={5}
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-black"
                placeholder="Nhập tin nhắn của bạn"
              />
            </div>

            <button
              type="submit"
              className="bg-black text-white px-6 py-2 rounded-md hover:bg-gray-800"
            >
              Gửi tin nhắn
            </button>
          </form>
        </div>
      </div>

      <div className="mt-12">
        <h2 className="text-2xl font-semibold mb-4">Bản đồ</h2>
        <div className="aspect-w-16 aspect-h-9 h-96 rounded-lg overflow-hidden shadow-md">
          <iframe
            src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3929.4035657212244!2d105.76063987479334!3d9.983483890121072!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x31a089ec2ecdc8e9%3A0xf4b9207c0d2491f5!2zMTU2IMSQLiBUcsawxqFuZyBWxKluaCBOZ3V5w6puLCBUaMaw4budbmcgVGjhuqFuaCwgQ8OhaSBSxINuZywgQ-G6p24gVGjGoSwgVmnhu4d0IE5hbQ!5e0!3m2!1svi!2s!4v1743405951433!5m2!1svi!2s"
            width="100%"
            height="100%"
            style={{ border: 0 }}
            allowFullScreen
            loading="lazy"
            referrerPolicy="no-referrer-when-downgrade"
            title="Agile Food Location"
          />
        </div>
      </div>
    </div>
  );
}
