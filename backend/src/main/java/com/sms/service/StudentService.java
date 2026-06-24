package com.sms.service;

import com.sms.dto.StudentRequest;
import com.sms.dto.StudentResponse;
import com.sms.dto.StudentStatsResponse;
import com.sms.entity.Student;
import com.sms.exception.DuplicateEmailException;
import com.sms.exception.ResourceNotFoundException;
import com.sms.repository.StudentRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.List;

@Service
@Transactional
public class StudentService {

    private final StudentRepository studentRepository;

    public StudentService(StudentRepository studentRepository) {
        this.studentRepository = studentRepository;
    }

    @Transactional(readOnly = true)
    public List<StudentResponse> findAll(String search, String major) {
        return studentRepository.search(search, major).stream()
                .map(StudentResponse::fromEntity)
                .toList();
    }

    @Transactional(readOnly = true)
    public StudentStatsResponse getStats() {
        List<String> majors = studentRepository.findDistinctMajors();
        return new StudentStatsResponse(studentRepository.count(), majors.size(), majors);
    }

    @Transactional(readOnly = true)
    public List<StudentResponse> findAll() {
        return findAll(null, null);
    }

    @Transactional(readOnly = true)
    public StudentResponse findById(Long id) {
        Student student = studentRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Student not found with id: " + id));
        return StudentResponse.fromEntity(student);
    }

    public StudentResponse create(StudentRequest request) {
        if (studentRepository.existsByEmail(request.getEmail())) {
            throw new DuplicateEmailException("Email already in use: " + request.getEmail());
        }

        Student student = mapToEntity(new Student(), request);
        if (student.getEnrollmentDate() == null) {
            student.setEnrollmentDate(LocalDate.now());
        }

        Student saved = studentRepository.save(student);
        return StudentResponse.fromEntity(saved);
    }

    public StudentResponse update(Long id, StudentRequest request) {
        Student student = studentRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Student not found with id: " + id));

        if (studentRepository.existsByEmailAndIdNot(request.getEmail(), id)) {
            throw new DuplicateEmailException("Email already in use: " + request.getEmail());
        }

        mapToEntity(student, request);
        Student saved = studentRepository.save(student);
        return StudentResponse.fromEntity(saved);
    }

    public void delete(Long id) {
        if (!studentRepository.existsById(id)) {
            throw new ResourceNotFoundException("Student not found with id: " + id);
        }
        studentRepository.deleteById(id);
    }

    private Student mapToEntity(Student student, StudentRequest request) {
        student.setFirstName(request.getFirstName());
        student.setLastName(request.getLastName());
        student.setEmail(request.getEmail());
        student.setPhone(request.getPhone());
        student.setDateOfBirth(request.getDateOfBirth());
        student.setMajor(request.getMajor());
        if (request.getEnrollmentDate() != null) {
            student.setEnrollmentDate(request.getEnrollmentDate());
        }
        return student;
    }
}
