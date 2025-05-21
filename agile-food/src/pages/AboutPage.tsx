export default function AboutPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-gray-50">
      {/* Header Section */}
      <div className="bg-black text-white py-16 px-4">
        <div className="container mx-auto max-w-5xl">
          <h1 className="text-4xl md:text-5xl font-bold mb-6">Giới thiệu</h1>
          <p className="text-lg md:text-xl text-gray-300 max-w-2xl">
            Khám phá câu chuyện của Agile Food - thương hiệu đồ ăn vặt hàng đầu Việt Nam với sứ mệnh mang đến những trải
            nghiệm ẩm thực tuyệt vời.
          </p>
        </div>
      </div>

      {/* About Us Section */}
      <div className="container mx-auto px-4 py-16 max-w-6xl">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
          <div>
            <h2 className="text-3xl font-bold mb-6 relative inline-block">
              Về chúng tôi
              <span className="absolute -bottom-2 left-0 w-1/2 h-1 bg-black"></span>
            </h2>
            <p className="text-gray-700 mb-6 text-lg leading-relaxed">
              Agile Food là thương hiệu đồ ăn vặt hàng đầu tại Việt Nam, chuyên cung cấp các loại đồ ăn vặt chất lượng
              cao, đảm bảo an toàn thực phẩm và giá cả hợp lý.
            </p>
            <p className="text-gray-700 mb-6 text-lg leading-relaxed">
              Chúng tôi tự hào mang đến cho khách hàng những trải nghiệm ẩm thực tuyệt vời với các sản phẩm đa dạng từ
              bánh kẹo, đồ chiên, đồ uống đến các loại snack nhập khẩu.
            </p>
            <p className="text-gray-700 text-lg leading-relaxed">
              Thành lập từ năm 2025, Agile Food đã không ngừng mở rộng và phát triển, trở thành điểm đến tin cậy của
              nhiều khách hàng yêu thích đồ ăn vặt ngon miệng, chất lượng.
            </p>
          </div>
          <div className="transform transition-all duration-300 hover:scale-[1.02]">
            <img
              src="https://bizweb.dktcdn.net/100/339/225/files/thuc-an-nhanh.jpg?v=1627638748869"
              alt="Agile Food Team"
              className="rounded-xl shadow-xl w-full h-auto border-4 border-white"
            />
          </div>
        </div>
      </div>

      {/* Core Values Section */}
      <div className="bg-gray-100 py-20 px-4">
        <div className="container mx-auto max-w-6xl">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4 inline-block relative">
              Giá trị cốt lõi
              <span className="absolute -bottom-2 left-1/4 right-1/4 h-1 bg-black"></span>
            </h2>
            <p className="text-gray-600 max-w-2xl mx-auto text-lg">
              Những giá trị định hình nên thương hiệu Agile Food và cam kết của chúng tôi với khách hàng
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              {
                title: "Chất lượng",
                description:
                  "Chúng tôi cam kết cung cấp các sản phẩm chất lượng cao, an toàn vệ sinh thực phẩm và đáp ứng các tiêu chuẩn chất lượng nghiêm ngặt.",
                icon: (
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                    strokeWidth={2}
                    stroke="white"
                    className="w-8 h-8"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M9 12.75 11.25 15 15 9.75M21 12c0 1.268-.63 2.39-1.593 3.068a3.745 3.745 0 0 1-1.043 3.296 3.745 3.745 0 0 1-3.296 1.043A3.745 3.745 0 0 1 12 21c-1.268 0-2.39-.63-3.068-1.593a3.746 3.746 0 0 1-3.296-1.043 3.745 3.745 0 0 1-1.043-3.296A3.745 3.745 0 0 1 3 12c0-1.268.63-2.39 1.593-3.068a3.745 3.745 0 0 1 1.043-3.296 3.746 3.746 0 0 1 3.296-1.043A3.746 3.746 0 0 1 12 3c1.268 0 2.39.63 3.068 1.593a3.746 3.746 0 0 1 3.296 1.043 3.746 3.746 0 0 1 1.043 3.296A3.745 3.745 0 0 1 21 12Z"
                    />
                  </svg>
                ),
              },
              {
                title: "Giá trị",
                description:
                  "Chúng tôi cung cấp sản phẩm với giá cả hợp lý, đảm bảo khách hàng nhận được giá trị xứng đáng với số tiền bỏ ra.",
                icon: (
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                    strokeWidth={2}
                    stroke="white"
                    className="w-8 h-8"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M12 6v12m-3-2.818.879.659c1.171.879 3.07.879 4.242 0 1.172-.879 1.172-2.303 0-3.182C13.536 12.219 12.768 12 12 12c-.725 0-1.45-.22-2.003-.659-1.106-.879-1.106-2.303 0-3.182s2.9-.879 4.006 0l.415.33M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z"
                    />
                  </svg>
                ),
              },
              {
                title: "Giao hàng nhanh",
                description:
                  "Chúng tôi cam kết giao hàng nhanh chóng, đúng hẹn đến tận nhà khách hàng, đảm bảo trải nghiệm mua sắm thuận tiện nhất.",
                icon: (
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                    strokeWidth={2}
                    stroke="white"
                    className="w-8 h-8"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M8.25 18.75a1.5 1.5 0 0 1-3 0m3 0a1.5 1.5 0 0 0-3 0m3 0h6m-9 0H3.375a1.125 1.125 0 0 1-1.125-1.125V14.25m17.25 4.5a1.5 1.5 0 0 1-3 0m3 0a1.5 1.5 0 0 0-3 0m3 0h1.125c.621 0 1.129-.504 1.09-1.124a17.902 17.902 0 0 0-3.213-9.193 2.056 2.056 0 0 0-1.58-.86H14.25M16.5 18.75h-2.25m0-11.177v-.958c0-.568-.422-1.048-.987-1.106a48.554 48.554 0 0 0-10.026 0 1.106 1.106 0 0 0-.987 1.106v7.635m12-6.677v6.677m0 4.5v-4.5m0 0h-12"
                    />
                  </svg>
                ),
              },
            ].map((value, index) => (
              <div
                key={index}
                className="bg-white p-8 rounded-xl shadow-lg border border-gray-100 transition-all duration-300 hover:shadow-2xl hover:-translate-y-1"
              >
                <div className="w-16 h-16 bg-black rounded-full flex items-center justify-center mb-6 mx-auto">
                  {value.icon}
                </div>
                <h3 className="text-2xl font-bold mb-4 text-center">{value.title}</h3>
                <p className="text-gray-600 text-center leading-relaxed">{value.description}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Team Section */}
      <div className="container mx-auto px-4 py-20 max-w-6xl">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold mb-4 inline-block relative">
            Đội ngũ
            <span className="absolute -bottom-2 left-1/4 right-1/4 h-1 bg-black"></span>
          </h2>
          <p className="text-gray-600 max-w-2xl mx-auto text-lg">
            Gặp gỡ những con người tài năng đằng sau thành công của Agile Food
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-10">
          {[
            {
              name: "Nguyễn Duy Tân",
              role: "CEO & Founder",
              image: "/images/dtan.jpg",
            },
            {
              name: "Phan Cảnh Toàn",
              role: "Marketing Director",
              image: "/images/ctoan.png",
            },
            {
              name: "Huỳnh Trung Tín",
              role: "Operations Manager",
              image: "/images/tidu.png",
            },
            {
              name: "Bùi Quốc Sự",
              role: "Customer Service",
              image: "/images/su.jpg",
            },
          ].map((member) => (
            <div key={member.name} className="text-center transition-all duration-300 hover:-translate-y-2">
              <div className="w-40 h-40 bg-gray-200 rounded-full mx-auto mb-6 overflow-hidden border-4 border-white shadow-lg">
                <img
                  src={member.image || "/placeholder.svg"}
                  alt={member.name}
                  className="w-full h-full object-cover"
                />
              </div>
              <h3 className="text-xl font-bold mb-2">{member.name}</h3>
              <p className="text-gray-600 text-lg">{member.role}</p>
              <div className="mt-4 w-12 h-1 bg-black mx-auto"></div>
            </div>
          ))}
        </div>
      </div>

      {/* Call to Action */}
      <div className="bg-black text-white py-16 px-4">
        <div className="container mx-auto text-center max-w-4xl">
          <h2 className="text-3xl font-bold mb-6">Trở thành đối tác của chúng tôi</h2>
          <p className="text-xl mb-8 text-gray-300">
            Hãy liên hệ ngay hôm nay để tìm hiểu thêm về các cơ hội hợp tác và phân phối sản phẩm Agile Food
          </p>
          <a
            href="#"
            className="inline-block bg-white text-black font-bold py-3 px-8 rounded-lg hover:bg-gray-200 transition-colors duration-300"
          >
            Liên hệ ngay
          </a>
        </div>
      </div>
    </div>
  )
}
